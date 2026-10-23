import { projectJournal } from "./project-journal.mjs";
/** OpenSandbox needs an OCI image reference, not a cloud template ID. */
export function projectManager(kit, ctx) {
  return {
    async prepareProject(directory, input) {
      const { journal, resources } = projectJournal(input, kit.errors);
      if (!kit.project) throw new kit.errors.ProviderConfigError("Update the CLI to a build with template launch support.");
      const image = await kit.project.buildImage(directory, { journal, dockerfile: input.build_profile?.dockerfile, image_repository: ctx.options.image_repository,
        name: input.alias, timeout: input.timeout });
      // The selected workflow owns startup; preparation never rewrites Dockerfile or entrypoint.
      return { reference: image, status: "ready", owned_resources: resources };
    },
  };
}
