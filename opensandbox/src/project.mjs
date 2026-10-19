/** OpenSandbox needs an OCI image reference, not a cloud template ID. */
export function projectManager(kit, ctx) {
  return {
    async prepareProject(directory, input) {
      if (!kit.project) throw new kit.errors.ProviderConfigError("Update the CLI to a build with template launch support.");
      const image = await kit.project.buildImage(directory, { image_repository: ctx.options.image_repository,
        base_image: ctx.options.build_base_image, ensure_user: "user", optional_copy: ["*.whl"], name: input.alias, timeout: input.timeout });
      // Keep the image's normal runtime alive; the launcher starts the project service through execd.
      return { reference: image, status: "ready",
        ...(input.template.start_cmd ? { startup_command: input.template.start_cmd } : {}),
        ...(input.template.ready_cmd ? { ready_command: input.template.ready_cmd } : {}) };
    },
  };
}
