import { projectJournal } from "./project-journal.mjs";
/** E2B owns project translation and the official SDK build. No host provider-ID dispatch. */
import path from "node:path";
import { createTemplates } from "./templates.mjs";
export function projectManager(kit, ctx) {
  return {
    async prepareProject(directory, input) {
      const { journal, resources } = projectJournal(input, kit.errors);
      const deadline = Date.now() + input.timeout * 1000;
      const remaining = () => {
        const seconds = (deadline - Date.now()) / 1000;
        if (seconds <= 0) throw new kit.errors.ProviderConfigError("Project preparation exceeded its deadline.");
        return seconds;
      };
      if (!kit.project) throw new kit.errors.ProviderConfigError("Update the CLI to a build with template launch support.");
      const Template = await kit.e2b.loadTemplate();
      const stage = await kit.project.stage(directory, { dockerfile: input.build_profile?.dockerfile });
      try {
        const factory = createTemplates({ Template, options: ctx.options, errors: kit.errors,
          fromProject: () => Template({ fileContextPath: stage.directory }).fromDockerfile(path.join(stage.directory, input.build_profile?.dockerfile ?? "Dockerfile")) });
        const spec = { cpu: input.template.cpu, memory: input.template.memory };
        if (input.workflow?.startup === "entrypoint" && input.template.start_cmd) spec.start_cmd = input.template.start_cmd;
        if (input.workflow?.startup === "entrypoint" && input.template.ready_cmd) spec.ready_cmd = input.template.ready_cmd;
        const intent = await journal.intent({ kind: "template", correlation_key: input.alias, cleanup: "manual" });
        const built = await factory.deploy({ source: { kind: "image", image: `project:${stage.digest}` }, name: input.alias, spec, timeout: remaining() });
        await journal.created(intent, built.template_id);
        return { reference: built.template_id, status: "ready", owned_resources: resources, identity: { native_version: built.build_id } };
      } finally { await stage.close(); }
    },
  };
}
