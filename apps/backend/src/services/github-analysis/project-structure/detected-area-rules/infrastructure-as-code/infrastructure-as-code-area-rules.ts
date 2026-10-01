import type { DetectedAreaRuleContext } from '../../project-structure-detected-areas.types';
import { addAnsibleInfrastructureAsCodeAreas } from './ansible-infrastructure-as-code-area-rules';
import { addAwsCdkInfrastructureAsCodeAreas } from './aws-cdk-infrastructure-as-code-area-rules';
import { addBicepInfrastructureAsCodeAreas } from './bicep-infrastructure-as-code-area-rules';
import { addHelmInfrastructureAsCodeAreas } from './helm-infrastructure-as-code-area-rules';
import { addPulumiInfrastructureAsCodeAreas } from './pulumi-infrastructure-as-code-area-rules';
import { addTerraformInfrastructureAsCodeAreas } from './terraform-infrastructure-as-code-area-rules';

/**
 * Applies infrastructure-as-code detected-area rules to the shared candidate
 * map.
 *
 * Provider-specific rules live in sibling modules and emit
 * `Infrastructure as code` candidates. `'Infrastructure as code'` was
 * renamed from the `'Infrastructure/config'` placeholder (previously
 * undetected, like `'CI/CD workflows'` and `'Mobile app'` before their own
 * implementations). Terraform/OpenTofu/Terragrunt, Helm and Bicep are
 * implemented; the remaining three v1 providers (AWS CDK, Pulumi, Ansible)
 * are still unimplemented placeholders -- see each module's own docstring --
 * so they contribute zero candidates until implemented one at a time.
 *
 * Inputs: `context.candidates` (shared `${name}::${path}::${primaryTech}`
 * map, mutated in place) and `context.index` (repository path/name/extension
 * lookup).
 * Output: none.
 * Side effects: fans out to the six provider detectors below. Dispatch order
 * does not decide which claim survives: candidates are keyed per primary
 * technology, so providers with overlapping evidence (for example Terraform
 * and Helm under one `deploy/` folder) each keep their own candidate.
 */
export function addInfrastructureAsCodeAreas({
  candidates,
  index,
}: DetectedAreaRuleContext): void {
  addTerraformInfrastructureAsCodeAreas({ candidates, index });
  addHelmInfrastructureAsCodeAreas({ candidates, index });
  addBicepInfrastructureAsCodeAreas({ candidates, index });
  addPulumiInfrastructureAsCodeAreas({ candidates, index });
  addAnsibleInfrastructureAsCodeAreas({ candidates, index });
  addAwsCdkInfrastructureAsCodeAreas({ candidates, index });
}
