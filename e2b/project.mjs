/** E2B owns project translation and the official SDK build. No host provider-ID dispatch. */
import path from "node:path";
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
      const Template = await kit.e2b.loadTemplate();
      const stage = await kit.project.stage(directory, { base_image: ctx.options.build_base_image, ensure_user: "user", optional_copy: ["*.whl"] });
      try {
        const factory = createTemplates({ Template, options: ctx.options, errors: kit.errors,
          fromProject: () => Template({ fileContextPath: stage.directory }).fromDockerfile(path.join(stage.directory, "Dockerfile")) });
        const spec = { cpu: input.template.cpu, memory: input.template.memory };
        if (input.template.start_cmd) spec.start_cmd = input.template.start_cmd;
        if (input.template.ready_cmd) spec.ready_cmd = input.template.ready_cmd;
        const built = await factory.deploy({ source: { kind: "image", image: `project:${stage.digest}` }, name: input.alias, spec, timeout: remaining() });
        return { reference: built.template_id, status: "ready", ...(input.template.ready_cmd ? { ready_command: input.template.ready_cmd } : {}) };
      } finally { await stage.close(); }
    },
  };
}
