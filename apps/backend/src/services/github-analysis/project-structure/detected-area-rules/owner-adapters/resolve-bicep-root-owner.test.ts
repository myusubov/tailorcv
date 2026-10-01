import { describe, expect, it } from 'vitest';
import { resolveBicepRootOwner } from './resolve-bicep-root-owner';

/**
 * Owner-resolution spec for Azure Bicep signals.
 *
 * The Bicep detector sets `rootHasBicep` when a `.bicep` file sits directly
 * at the repo root. Every path below is a real file from a surveyed GitHub
 * repository, named in the comments.
 *
 * The expected owner is the directory a person would call the Bicep project
 * for that evidence path, decided from the repository's layout and not from
 * what the resolver returns, so a failing case is a real gap in the resolver
 * for Bicep and not a test to adjust. The rules used to decide:
 * - Azure Developer CLI repos keep the whole project in `infra/`.
 * - A folder named `bicep`, or the folder holding `bicepconfig.json`, is the
 *   Bicep project root, wherever it sits in the tree.
 * - Several stacks under one project folder (`bicep/acre`, `bicep/amr`)
 *   belong to that folder.
 * - A module registry or template collection with no project folder is one
 *   project at the repo root.
 * - Each service with its own `infrastructure` folder owns it.
 * - Environment folders collapse into one owner.
 *
 * Every case passes `rootHasBicep: false` except the root-template group.
 * Demo and test folders are not this function's job: the Bicep detector's
 * entry schemas drop those paths before the resolver runs.
 */
describe('resolveBicepRootOwner', () => {
  describe('an azd infra folder owns its templates, parameters and config', () => {
    it.each([
      // Azure-Samples/azure-search-openai-demo.
      ['infra/main.bicep', 'infra'],
      ['infra/main.parameters.json', 'infra'],
      ['infra/core/host/appservice.bicep', 'infra'],
      ['infra/app/functions.bicep', 'infra'],
      // Azure/reliable-web-app-pattern-dotnet.
      ['infra/bicepconfig.json', 'infra'],
      ['infra/modules/hub-network.bicep', 'infra'],
      ['infra/types/WafRules.bicep', 'infra'],
      // The same repo's nested workshop sample keeps its own infra folder.
      ['workshop/azd-sample/infra/main.bicep', 'workshop/azd-sample/infra'],
      [
        'workshop/azd-sample/infra/main.parameters.json',
        'workshop/azd-sample/infra',
      ],
      // karpikpl/foundry-with-apim: several stacks inside one infra folder.
      ['infra/ai-gateway-basic/main.bicep', 'infra'],
      ['infra/ai-gateway-internal/main.bicepparam', 'infra'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: false }),
      ).toBe(owner);
    });
  });

  describe('a folder named bicep is the project root', () => {
    it.each([
      // spiroskon/openclaw-azure-containerapps.
      ['bicep/main.bicep', 'bicep'],
      ['bicep/main.bicepparam', 'bicep'],
      // raas-dev/artery.
      ['bicep/bicepconfig.json', 'bicep'],
      ['bicep/acr.bicep', 'bicep'],
      // danielscholl/managed-platform.
      ['bicep/deploy.bicep', 'bicep'],
      ['bicep/modules/aks_cluster.bicep', 'bicep'],
      // Azure/AKS-Construction.
      ['bicep/appgw.bicep', 'bicep'],
      // robertopc1/amr-deployment-examples: two stacks under one folder.
      ['bicep/acre/main.bicep', 'bicep'],
      ['bicep/acre/keyvault.bicep', 'bicep'],
      ['bicep/amr/main.bicepparam', 'bicep'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: false }),
      ).toBe(owner);
    });
  });

  describe('a bicep folder nested inside another folder owns from that folder down', () => {
    it.each([
      // Azure/azure-openai-landing-zone: one bicep folder per foundation.
      [
        'foundation/aistudio-infra/bicep/main.bicep',
        'foundation/aistudio-infra/bicep',
      ],
      [
        'foundation/aistudio-infra/bicep/modules/dependent/aiservices.bicep',
        'foundation/aistudio-infra/bicep',
      ],
      // Azure/ALZ-Bicep: the folder holding bicepconfig.json is the project.
      ['infra-as-code/bicep/bicepconfig.json', 'infra-as-code/bicep'],
      [
        'infra-as-code/bicep/modules/logging/logging.bicep',
        'infra-as-code/bicep',
      ],
      [
        'infra-as-code/bicep/orchestration/hubPeeredSpoke/hubPeeredSpoke.bicep',
        'infra-as-code/bicep',
      ],
      // microsoft/hands-on-lab-code-to-cloud: the folder holding bicepconfig.json
      // is the project; its name is listed as a home folder.
      [
        'infra-starter/src/bicep-devcenter/main.bicep',
        'infra-starter/src/bicep-devcenter',
      ],
      [
        'infra-starter/src/bicep-devcenter/bicepconfig.json',
        'infra-starter/src/bicep-devcenter',
      ],
      [
        'infra-starter/src/bicep-devcenter/modules/network.bicep',
        'infra-starter/src/bicep-devcenter',
      ],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: false }),
      ).toBe(owner);
    });
  });

  describe('a module registry with no project folder is one project at the repo root', () => {
    it.each([
      // Azure/bicep-registry-modules.
      ['bicepconfig.json', '.'],
      ['avm/res/network/virtual-network/main.bicep', '.'],
      ['avm/res/network/virtual-network/subnet/main.bicep', '.'],
      ['avm/ptn/subscription/service-health-alerts/main.bicepparam', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: false }),
      ).toBe(owner);
    });
  });

  describe('a modules folder with no project folder belongs to the repo root', () => {
    it.each([
      // glloyd2010f/azure-bicep-examples. The generic resolver would return
      // the file path itself here.
      ['modules/appSvc.bicep', '.'],
      ['modules/keyVault.bicep', '.'],
      ['modules/appConfiguration.keyValues.bicep', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: false }),
      ).toBe(owner);
    });
  });

  describe('each service with its own infrastructure folder owns it', () => {
    it.each([
      // nikneem/meme-it.
      ['infrastructure/main.bicep', 'infrastructure'],
      ['infrastructure/main.bicepparam', 'infrastructure'],
      ['src/Games/infrastructure/main.bicep', 'src/Games/infrastructure'],
      ['src/Games/infrastructure/service.bicep', 'src/Games/infrastructure'],
      [
        'src/MemeItApp/infrastructure/dev.parameters.bicepparam',
        'src/MemeItApp/infrastructure',
      ],
      ['src/Realtime/infrastructure/main.bicep', 'src/Realtime/infrastructure'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: false }),
      ).toBe(owner);
    });
  });

  describe('environment folders collapse into one owner', () => {
    it.each([
      // microsoft/hands-on-lab-code-to-cloud.
      ['environments/FunctionApp/main.bicep', 'environments'],
      ['environments/WebApp/main.bicep', 'environments'],
      ['environments/Sandbox/main.bicep', 'environments'],
    ])('%s -> %s', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: false }),
      ).toBe(owner);
    });
  });

  describe('a root template owns the whole repo', () => {
    // gsvibhav/Virtual-Machine: main.bicep and main.bicepparam at the root
    // with modules/ beside them.
    it.each([
      ['main.bicep', '.'],
      ['main.bicepparam', '.'],
      ['modules/vm.bicep', '.'],
      ['modules/nsg.bicep', '.'],
      ['modules/vnet.bicep', '.'],
    ])('%s -> %s when the root holds Bicep', (path, owner) => {
      expect(
        resolveBicepRootOwner({ path, rootHasBicep: true }),
      ).toBe(owner);
    });
  });

  // Known, accepted gaps: the resolver only recognizes exact folder names, so
  // a project folder with an unlisted name is not found, and a module named
  // like a home folder is taken for one. Each case asserts the owner a person
  // would call the project and is pinned with `it.fails`, so the suite turns
  // red the moment the resolver handles it and the `it.fails` can be dropped.
  describe('known gaps', () => {
    it.fails.each([
      // Azure/ALZ-Bicep: CI infrastructure next to the product.
      [
        '.github/azFunction/AzFunctionInfrastructure/main.bicep',
        '.github/azFunction/AzFunctionInfrastructure',
      ],
      [
        '.github/azFunction/AzFunctionInfrastructure/rbac.bicep',
        '.github/azFunction/AzFunctionInfrastructure',
      ],
      // Azure/bicep-registry-modules: a module named deployment is not a home
      // folder.
      ['avm/res/cognitive-services/account/deployment/main.bicep', '.'],
    ])('%s -> %s', (path, owner) => {
      expect(resolveBicepRootOwner({ path, rootHasBicep: false })).toBe(owner);
    });
  });

  describe('judgment calls not yet decided', () => {
    it.todo(
      'a collection of independent templates under an unlisted parent (Azure/azure-quickstart-templates: quickstarts/microsoft.web/function-http-trigger/main.bicep): one area at "." or one per template',
    );
  });
});
