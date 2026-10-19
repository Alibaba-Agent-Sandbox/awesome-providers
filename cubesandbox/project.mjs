/** Native CubeAPI registration belongs to this adapter, including resource units and polling. */
import { createTemplates } from "./templates.mjs";
export function projectManager(kit, ctx) {
  return {
    async prepareProject(directory, input) {
      const deadline = Date.now() + input.timeout * 1000;
      const remaining = () => {
        const seconds = (deadline - Date.now()) / 1000;
        if (seconds <= 0) throw new kit.errors.ProviderConfigError("Project preparation exceeded its deadline.");
        return seconds;
      };
      if (!kit.project) throw new kit.errors.ProviderConfigError("Update the CLI to a build with template launch support.");
      const image = await kit.project.buildImage(directory, { image_repository: ctx.options.image_repository,
        base_image: ctx.options.build_base_image, ensure_user: "user", optional_copy: ["*.whl"], name: input.alias, timeout: remaining() });
      const factory = createTemplates({ options: ctx.options, errors: kit.errors });
      const registry = ctx.options.registry_username || ctx.options.registry_password ?
        { username: ctx.options.registry_username, password: ctx.options.registry_password } : undefined;
      const built = await factory.deploy({ source: { kind: "image", image }, name: input.alias,
        spec: { cpu: input.template.cpu, memory: input.template.memory }, timeout: remaining(), ...(registry ? { registry } : {}) });
      return { reference: built.template_id, status: "ready",
        ...(input.template.start_cmd ? { startup_command: input.template.start_cmd } : {}),
        ...(input.template.ready_cmd ? { ready_command: input.template.ready_cmd } : {}) };
    },
  };
}
