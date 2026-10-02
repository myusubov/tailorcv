import { describe, expect, it } from 'vitest';
import { resolveManifestDirectoryOwner } from './resolve-manifest-directory-owner';

/**
 * Owner-resolution spec for Ansible evidence paths. The adapter is shared with
 * the Helm and Pulumi detectors, whose layouts are in
 * `resolve-manifest-directory-owner.helm.test.ts` and
 * `resolve-manifest-directory-owner.pulumi.test.ts`.
 *
 * Every layout below is a real repository from the tree survey, named in the
 * comments. Ansible has no single manifest file, so `manifestDirectories` is
 * a list of project directories like the Ansible detector derives
 * (`deriveManifestDirectories`: the folder of `ansible.cfg` or `galaxy.yml`,
 * the folder above the first `roles/` segment for `tasks/main.yml`, and the
 * folder above `group_vars/` or `host_vars/`, cut at `inventory`). The lists
 * are written by hand for each layout and also hold nested directories (such
 * as vendored roles with their own `molecule/` folders) to pin the folding
 * rule, so they are not always exactly what the derivation returns. This spec
 * covers only what the adapter does with a list; the derivation is not tested
 * here. Large repos are abridged to the directories a case needs; the
 * abridged ones say so. A row is `[evidence path, expected owner]` when the
 * whole group shares one `manifestDirectories` constant.
 *
 * The expected owner is the directory a person would call the Ansible project
 * for that evidence path, decided from the repository's layout and not from
 * what the resolver returns, so a failing case is a real gap in the resolver
 * and not a test to adjust. Decisions baked into the expectations, change them
 * here if you decide otherwise:
 * - A project folder owns its config, variables, roles and playbooks, whatever
 *   the folder is called.
 * - A role or project nested inside another folds into the enclosing one, so
 *   vendored Galaxy roles with their own `molecule/` folders stay in the
 *   project that holds them.
 * - Two or more projects that share a parent directory collapse into that
 *   parent. A lone project keeps its own folder. The parent's name never
 *   matters.
 * - A root project owns every path in the repo.
 * - A file outside any project folder owns its own directory, so it never
 *   passes the detector's gate on its own.
 *
 * Demo, test and `.github/` paths are not this function's job: the Ansible
 * detector's entry schemas drop them before the resolver runs.
 */
describe('resolveManifestDirectoryOwner (Ansible projects)', () => {
  describe('a root project owns the whole repo', () => {
    describe('a standalone role', () => {
      // geerlingguy/ansible-role-docker.
      const manifestDirectories = ['.'];
      it.each([
        ['tasks/main.yml', '.'],
        ['defaults/main.yml', '.'],
        ['molecule/default/molecule.yml', '.'],
        ['.ansible-lint', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('a root project beats the roles and contrib projects below it', () => {
      // kubernetes-sigs/kubespray, abridged: a root `ansible.cfg`, a contrib
      // folder with its own `group_vars/`, and a role folder listed as a
      // nested directory to pin the folding rule.
      const manifestDirectories = ['.', 'contrib/azurerm', 'roles/adduser'];
      it.each([
        ['ansible.cfg', '.'],
        ['roles/adduser/tasks/main.yml', '.'],
        ['roles/adduser/molecule/default/molecule.yml', '.'],
        ['contrib/azurerm/group_vars/all', '.'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('a project in an ansible folder owns everything below it', () => {
    // ArmanTaheriGhaleTaki/abr-sefid: `group_vars` sit two levels down in
    // `inventory/mycluster/`, and the detector steps them out to `ansible`.
    const manifestDirectories = ['ansible'];
    it.each([
      ['ansible/ansible.cfg', 'ansible'],
      ['ansible/.ansible-lint', 'ansible'],
      ['ansible/inventory/mycluster/group_vars/all.yml', 'ansible'],
      ['ansible/playbooks/k8s.yaml', 'ansible'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('vendored roles fold into their project', () => {
    // XerberusTeam/network-protocol: Galaxy roles under `roles/` carry their
    // own `molecule/` folders. The vendored role folders are listed as nested
    // directories below `infra/ansible` to pin the folding rule; the detector's
    // derivation ignores `molecule/` and would not return them. A second
    // `ansible/` project has a different parent.
    const manifestDirectories = [
      'infra/ansible',
      'infra/ansible/roles/geerlingguy.docker',
      'telemetry-web/infra/ansible',
      'telemetry-web/infra/ansible/roles/geerlingguy.docker',
    ];
    it.each([
      ['infra/ansible/ansible.cfg', 'infra/ansible'],
      ['infra/ansible/roles/common/tasks/main.yml', 'infra/ansible'],
      [
        'infra/ansible/roles/geerlingguy.docker/molecule/default/molecule.yml',
        'infra/ansible',
      ],
      ['telemetry-web/infra/ansible/ansible.cfg', 'telemetry-web/infra/ansible'],
      [
        'telemetry-web/infra/ansible/roles/geerlingguy.docker/molecule/default/molecule.yml',
        'telemetry-web/infra/ansible',
      ],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('projects under different parents stay separate', () => {
    describe('one ansible folder per platform', () => {
      // clong/DetectionLab.
      const manifestDirectories = [
        'azure/ansible',
        'esxi/ansible',
        'proxmox/ansible',
      ];
      it.each([
        ['azure/ansible/ansible.cfg', 'azure/ansible'],
        ['azure/ansible/roles/common/tasks/main.yml', 'azure/ansible'],
        ['esxi/ansible/group_vars/all.yml', 'esxi/ansible'],
        ['proxmox/ansible/roles/common/tasks/main.yml', 'proxmox/ansible'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('an ansible folder beside a backup copy', () => {
      // C0chett0/homelab.
      const manifestDirectories = ['ansible', 'backup/ansible'];
      it.each([
        ['ansible/ansible.cfg', 'ansible'],
        ['ansible/group_vars/all.yml', 'ansible'],
        ['backup/ansible/group_vars/all.yml', 'backup/ansible'],
        ['backup/ansible/roles/base/tasks/main.yml', 'backup/ansible'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('sibling projects collapse into their shared parent', () => {
    describe('a collection of example projects at the repo root', () => {
      // ansible/ansible-examples, abridged to six of its project folders:
      // `lamp_haproxy/aws` is a project inside another, and
      // `windows/wamp_haproxy` is the only project under `windows`.
      const manifestDirectories = [
        'jboss-standalone',
        'lamp_haproxy',
        'lamp_haproxy/aws',
        'lamp_simple',
        'windows/wamp_haproxy',
      ];
      it.each([
        ['lamp_simple/site.yml', '.'],
        ['jboss-standalone/roles/java-app/tasks/main.yml', '.'],
        ['lamp_haproxy/aws/roles/common/tasks/main.yml', '.'],
        ['windows/wamp_haproxy/site.yml', 'windows/wamp_haproxy'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });

    describe('several collections side by side', () => {
      // NagiosEnterprises/automation, abridged: four collections share a
      // parent and one older project sits beside them under `ansible`.
      const manifestDirectories = [
        'ansible/ansible_collections/nagios/backup_ncpa',
        'ansible/ansible_collections/nagios/nagios_xi',
        'ansible/ansible_collections/nagios/ncpa',
        'ansible/old_ncpa',
      ];
      it.each([
        [
          'ansible/ansible_collections/nagios/ncpa/galaxy.yml',
          'ansible/ansible_collections/nagios',
        ],
        [
          'ansible/ansible_collections/nagios/backup_ncpa/galaxy.yml',
          'ansible/ansible_collections/nagios',
        ],
        ['ansible/old_ncpa/ansible.cfg', 'ansible/old_ncpa'],
      ])('%s -> %s', (path, owner) => {
        expect(
          resolveManifestDirectoryOwner({ path, manifestDirectories }),
        ).toBe(owner);
      });
    });
  });

  describe('a file with no project resolves to its own folder', () => {
    // apache/causeway: Antora's `playbooks/site.yml` matches a playbook name,
    // but no Ansible marker exists, so the owner has no anchor and the
    // detector's gate never passes for it.
    const manifestDirectories: string[] = [];
    it.each([
      ['antora/playbooks/site.yml', 'antora/playbooks'],
      ['antora/playbooks/site-deploy.yml', 'antora/playbooks'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveManifestDirectoryOwner({ path, manifestDirectories }),
      ).toBe(owner);
    });
  });

  describe('judgment calls not yet decided', () => {
    it.todo(
      'unrelated demos side by side under one folder (Michael-Yee/Blogs: code/ansible-container-demo and code/ansible-playbook-demo): one area at "code" or one per demo',
    );
    it.todo(
      'a project below a workspace container (services/<name>/ansible/...): the adapter returns the unit services/<name>, not the ansible folder; no surveyed emitter had this shape, so the expected owner is not decided',
    );
  });
});
