import { describe, expect, it } from 'vitest';
import { resolveHelmChartOwner } from './resolve-helm-chart-owner';

/**
 * Owner-resolution spec for Helm evidence paths: each case describes what a
 * real chart layout resolves to under `resolveHelmChartOwner`.
 *
 * Cases come from real chart layouts seen in a tree survey of about 130 GitHub
 * repositories. Real repos named in the comments: hashicorp/vault-helm,
 * apache/airflow, grafana/loki, cert-manager/cert-manager,
 * prometheus-community/helm-charts, bitnami/charts, helm/charts,
 * elastic/helm-charts, argoproj/argo-helm, Kong/charts, tetratelabs/helm-charts.
 *
 * Each `describe` names the repository layout the rows belong to. Several
 * outcomes depend on charts elsewhere in the tree, so every case passes
 * `chartDirectories`, the directory of every counted `Chart.yaml` in that
 * repository (`.` for a root chart). A row is `[evidence path, chart
 * directories, expected owner]`, or `[evidence path, expected owner]` when the
 * whole group shares one `chartDirectories` constant. Demo and test folders
 * are already excluded by the detector's entry schemas, so no case uses them.
 *
 * Decisions baked into the expectations, change them here if you decide
 * otherwise:
 * - A chart nested inside another chart is a subchart and folds into the
 *   enclosing chart, whatever the folder between them is called.
 * - Two or more top-level charts that share a parent directory collapse into
 *   that parent. A lone top-level chart keeps its own directory. The parent's
 *   name never matters.
 * - A workspace unit (`apps/<name>`, `services/<name>`, ...) owns every chart
 *   below it, as in `resolveTerraformRootOwner`.
 * - A root chart owns every path in the repo.
 * - A companion file (`values.yaml`, `templates/*`, `.helmignore`,
 *   `Chart.lock`) resolves to the owner of its nearest enclosing chart, the
 *   same owner its `Chart.yaml` gets, otherwise the detector's gate can never
 *   pass.
 * - Folder-name matching is case-insensitive on lookup and preserves the
 *   original casing in the returned owner.
 */
describe('resolveHelmChartOwner', () => {
  describe('layout: Chart.yaml at the repo root (hashicorp/vault-helm) -> "."', () => {
    const chartDirectories = ['.'];
    it.each([
      ['Chart.yaml', '.'],
      ['values.yaml', '.'],
      ['.helmignore', '.'],
      ['Chart.lock', '.'],
      ['templates/server-statefulset.yaml', '.'],
      ['templates/_helpers.tpl', '.'],
      ['templates/tests/server-test.yaml', '.'],
      ['crds/vaultsecret.yaml', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: root chart plus charts/redis and deploy/extra -> "."', () => {
    // Every other chart in the repo sits below the root chart's directory.
    const chartDirectories = ['.', 'charts/redis', 'deploy/extra'];
    it.each([
      ['charts/redis/Chart.yaml', '.'],
      ['charts/redis/values.yaml', '.'],
      ['charts/redis/templates/deployment.yaml', '.'],
      ['deploy/extra/Chart.yaml', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: one chart in the whole repo keeps its own directory', () => {
    it.each([
      // apache/airflow.
      ['chart/Chart.yaml', ['chart'], 'chart'],
      ['chart/values.yaml', ['chart'], 'chart'],
      ['chart/templates/scheduler/scheduler-deployment.yaml', ['chart'], 'chart'],
      ['chart/.helmignore', ['chart'], 'chart'],
      // grafana/loki: deep inside an application repo.
      [
        'production/helm/loki/Chart.yaml',
        ['production/helm/loki'],
        'production/helm/loki',
      ],
      [
        'production/helm/loki/templates/_helpers.tpl',
        ['production/helm/loki'],
        'production/helm/loki',
      ],
      // cert-manager/cert-manager: under a name Terraform treats as a home
      // folder (`deploy`); Helm has no such list.
      [
        'deploy/charts/cert-manager/Chart.yaml',
        ['deploy/charts/cert-manager'],
        'deploy/charts/cert-manager',
      ],
      [
        'deploy/charts/cert-manager/values.yaml',
        ['deploy/charts/cert-manager'],
        'deploy/charts/cert-manager',
      ],
      // langfuse/langfuse-k8s.
      ['charts/langfuse/Chart.yaml', ['charts/langfuse'], 'charts/langfuse'],
      ['charts/langfuse/Chart.lock', ['charts/langfuse'], 'charts/langfuse'],
    ])('%s -> %s', (path, chartDirectories, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: sibling top-level charts under one parent collapse into it', () => {
    it.each([
      // prometheus-community/helm-charts and argoproj/argo-helm: charts/<name>
      // with several sibling charts.
      [
        'charts/alertmanager/Chart.yaml',
        ['charts/alertmanager', 'charts/kube-state-metrics', 'charts/jiralert'],
        'charts',
      ],
      [
        'charts/kube-state-metrics/values.yaml',
        ['charts/alertmanager', 'charts/kube-state-metrics', 'charts/jiralert'],
        'charts',
      ],
      [
        'charts/argo-cd/templates/argocd-server/deployment.yaml',
        ['charts/argo-cd', 'charts/argo-events'],
        'charts',
      ],
      // bitnami/charts: the parent name is not on any list.
      [
        'bitnami/apache/Chart.yaml',
        ['bitnami/apache', 'bitnami/redis', 'bitnami/postgresql'],
        'bitnami',
      ],
      [
        'bitnami/redis/templates/master/application.yaml',
        ['bitnami/apache', 'bitnami/redis', 'bitnami/postgresql'],
        'bitnami',
      ],
      // Exactly two siblings (helm/api and helm/web) is enough.
      ['helm/api/Chart.yaml', ['helm/api', 'helm/web'], 'helm'],
      // elastic/helm-charts: siblings at the repo root have "." as parent.
      [
        'elasticsearch/Chart.yaml',
        ['elasticsearch', 'kibana', 'logstash'],
        '.',
      ],
      ['kibana/templates/deployment.yaml', ['elasticsearch', 'kibana'], '.'],
    ])('%s -> %s', (path, chartDirectories, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: helm/charts, stable/ and incubator/ each hold many charts', () => {
    const chartDirectories = [
      'stable/mysql',
      'stable/redis',
      'incubator/kafka',
      'incubator/cassandra',
    ];
    it.each([
      ['stable/mysql/Chart.yaml', 'stable'],
      ['stable/redis/values.yaml', 'stable'],
      ['incubator/kafka/Chart.yaml', 'incubator'],
      ['incubator/cassandra/templates/statefulset.yaml', 'incubator'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: charts/api and charts/web plus a lone deploy/worker', () => {
    const chartDirectories = ['charts/api', 'charts/web', 'deploy/worker'];
    it.each([
      ['charts/api/Chart.yaml', 'charts'],
      ['charts/web/values.yaml', 'charts'],
      ['deploy/worker/Chart.yaml', 'deploy/worker'],
      ['deploy/worker/templates/job.yaml', 'deploy/worker'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: a subchart folds into its enclosing chart', () => {
    it.each([
      // prometheus-community/helm-charts: kube-prometheus-stack ships a CRD
      // subchart; the enclosing chart is one of many siblings under charts/.
      [
        'charts/kube-prometheus-stack/charts/crds/Chart.yaml',
        [
          'charts/alertmanager',
          'charts/kube-prometheus-stack',
          'charts/kube-prometheus-stack/charts/crds',
        ],
        'charts',
      ],
      // A lone charts/app with a subchart charts/app/charts/redis.
      [
        'charts/app/charts/redis/Chart.yaml',
        ['charts/app', 'charts/app/charts/redis'],
        'charts/app',
      ],
      [
        'charts/app/charts/redis/templates/deployment.yaml',
        ['charts/app', 'charts/app/charts/redis'],
        'charts/app',
      ],
      // Kong/charts: CRD-only subcharts under charts/gateway-operator.
      [
        'charts/gateway-operator/charts/kic-crds/Chart.yaml',
        [
          'charts/gateway-operator',
          'charts/gateway-operator/charts/kic-crds',
          'charts/gateway-operator/charts/gwapi-standard-crds',
        ],
        'charts/gateway-operator',
      ],
      // Nesting decides, not the folder name between the two charts:
      // helm/infrastructure is a chart with subcharts/certificate-manager.
      [
        'helm/infrastructure/subcharts/certificate-manager/Chart.yaml',
        [
          'helm/infrastructure',
          'helm/infrastructure/subcharts/certificate-manager',
        ],
        'helm/infrastructure',
      ],
      // Two levels of nesting under a lone charts/app.
      [
        'charts/app/charts/db/charts/exporter/Chart.yaml',
        [
          'charts/app',
          'charts/app/charts/db',
          'charts/app/charts/db/charts/exporter',
        ],
        'charts/app',
      ],
    ])('%s -> %s', (path, chartDirectories, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: companion files resolve to their nearest enclosing chart', () => {
    // Siblings charts/api and charts/web.
    const chartDirectories = ['charts/api', 'charts/web'];
    it.each([
      ['charts/api/values.yaml', 'charts'],
      ['charts/api/.helmignore', 'charts'],
      ['charts/api/Chart.lock', 'charts'],
      ['charts/api/templates/deployment.yaml', 'charts'],
      ['charts/api/templates/tests/test-connection.yaml', 'charts'],
      ['charts/web/templates/_helpers.tpl', 'charts'],
      ['charts/api/ci/values.yaml', 'charts'],
      ['charts/api/crds/certificate.yaml', 'charts'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: a lone chart at charts/api, the file name never changes the owner', () => {
    it.each([
      'Chart.yaml',
      'values.yaml',
      '.helmignore',
      'Chart.lock',
      'templates/deployment.yaml',
      'templates/_helpers.tpl',
      'templates/NOTES.txt',
    ])('charts/api/%s -> charts/api', (file) => {
      expect(
        resolveHelmChartOwner({
          path: `charts/api/${file}`,
          chartDirectories: ['charts/api'],
        }),
      ).toBe('charts/api');
    });
  });

  describe('layout: a workspace unit owns every chart below it', () => {
    it.each([
      // apps/web/chart and apps/api/chart.
      [
        'apps/web/chart/Chart.yaml',
        ['apps/web/chart', 'apps/api/chart'],
        'apps/web',
      ],
      [
        'apps/api/chart/values.yaml',
        ['apps/web/chart', 'apps/api/chart'],
        'apps/api',
      ],
      // services/billing/helm and services/ledger/helm.
      [
        'services/billing/helm/templates/deployment.yaml',
        ['services/billing/helm', 'services/ledger/helm'],
        'services/billing',
      ],
      // The chart sits directly in the unit (apps/web and apps/api).
      ['apps/web/Chart.yaml', ['apps/web', 'apps/api'], 'apps/web'],
      ['packages/backend/Chart.yaml', ['packages/backend'], 'packages/backend'],
      // Unit beats sibling collapse: apps/web/charts/frontend and
      // apps/web/charts/cache stay in the unit, not apps/web/charts.
      [
        'apps/web/charts/frontend/Chart.yaml',
        ['apps/web/charts/frontend', 'apps/web/charts/cache'],
        'apps/web',
      ],
      // Scoped packages are owned by the scoped package.
      [
        'packages/@acme/deploy/chart/Chart.yaml',
        ['packages/@acme/deploy/chart'],
        'packages/@acme/deploy',
      ],
      // Unit beats a subchart folder below it.
      [
        'apps/web/chart/charts/redis/Chart.yaml',
        ['apps/web/chart', 'apps/web/chart/charts/redis'],
        'apps/web',
      ],
    ])('%s -> %s', (path, chartDirectories, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: a companion with no enclosing chart resolves to its own directory', () => {
    // Orphan `values.yaml` and `templates/` exist outside Helm (Ansible roles,
    // cookiecutter templates, helmfile value folders) in a repo that also has
    // a real chart at charts/api. Their own directory keeps them from ever
    // sharing an owner with a manifest.
    const chartDirectories = ['charts/api'];
    it.each([
      ['config/values.yaml', 'config'],
      ['hack/minikube/values.yaml', 'hack/minikube'],
      ['roles/nginx/templates/nginx.conf.j2', 'roles/nginx/templates'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('layout: folder names keep their casing', () => {
    it.each([
      // Charts/API and Charts/Web siblings.
      ['Charts/API/Chart.yaml', ['Charts/API', 'Charts/Web'], 'Charts'],
      // Lone Charts/App with subchart Charts/App/charts/Redis.
      [
        'Charts/App/charts/Redis/Chart.yaml',
        ['Charts/App', 'Charts/App/charts/Redis'],
        'Charts/App',
      ],
      // Apps/Web/Chart and Apps/Api/Chart.
      [
        'Apps/Web/Chart/Chart.yaml',
        ['Apps/Web/Chart', 'Apps/Api/Chart'],
        'Apps/Web',
      ],
    ])('%s -> %s', (path, chartDirectories, owner) => {
      expect(resolveHelmChartOwner({ path, chartDirectories })).toBe(owner);
    });
  });

  describe('judgment calls not yet decided', () => {
    it.todo(
      'a parent that holds sibling charts and is itself under another sibling-holding parent (istio/istio: manifests/charts/{base,default,...} and manifests/charts/gateways/{istio-egress,istio-ingress}): one owner at manifests/charts or two',
    );
    it.todo(
      'a collection with several unrelated parents and no home folder (tetratelabs/helm-charts: charts/addons, charts/demos, charts/istio/<version>): hundreds of owners unless a further collapse rule exists',
    );
    it.todo(
      'independent apps under one parent (helm/api and helm/web in an application repo) collapse into one area; decide whether that is acceptable or needs a name list',
    );
    it.todo(
      'a root-level orphan values.yaml next to root-level sibling charts (elastic/helm-charts collapses siblings to ".", so an orphan at "." shares their owner)',
    );
    it.todo(
      'a chart directly inside a workspace container (apps/Chart.yaml) names no unit; Terraform resolves the equivalent two-segment path to "."',
    );
    it.todo(
      'a single chart under a conventional home folder (charts/quote-api): owner charts/quote-api as above, or charts',
    );
  });
});
