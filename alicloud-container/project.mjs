/** SandboxSet structure reviewed at openkruise/agents ee289a6b0410f64eb03a59ee20b18f8cc59ed3cd.
 * Preserve the user's base SandboxSet runtime injection, volumes, probes and native startup.
 */
import { createHash } from "node:crypto";
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
      const options = ctx.options;
      const namespace = String(options.kube_namespace ?? ""), baseName = String(options.build_template || "code-interpreter");
      const valid = value => /^[a-z0-9][a-z0-9.-]{0,62}$/.test(value);
      if (!valid(namespace) || !valid(baseName)) throw new kit.errors.ProviderConfigError("Configure kube_namespace for the sandbox-manager API-key namespace and a valid build_template name.");
      const args = ["--namespace", namespace];
      if (options.kube_context) args.push("--context", String(options.kube_context));
      const run = (tail, extra = {}) => kit.project.runTool("kubectl", [...args, ...tail], { timeout: remaining(), ...extra });
      let base;
      try { base = JSON.parse(await run(["get", "sandboxset", baseName, "-o", "json"])); }
      catch { throw new kit.errors.ProviderConfigError("Cannot read the base SandboxSet. Configure kubectl access, kube_namespace and build_template."); }
      const pod = base?.spec?.template?.spec;
      const containers = pod?.containers;
      const selected = Array.isArray(containers) ? containers.filter(c => !options.build_container || c.name === options.build_container) : [];
      if (selected.length !== 1 || typeof selected[0].image !== "string") throw new kit.errors.ProviderConfigError("Set build_container to the main container in the base SandboxSet.");
      const image = await kit.project.buildImage(directory, { image_repository: options.image_repository,
        base_image: options.build_base_image || selected[0].image, ensure_user: "user", optional_copy: ["*.whl"], name: input.alias, timeout: remaining() });
      selected[0].image = image;
      const fingerprint = createHash("sha256").update(JSON.stringify([image, base.metadata?.uid, { ...base.spec, replicas: 0 }, input.template.cpu, input.template.memory])).digest("hex").slice(0, 16);
      const name = `abx-${input.alias.slice(0, 41)}-${fingerprint}`;
      selected[0].resources = { requests: { cpu: String(input.template.cpu), memory: `${input.template.memory}Mi` }, limits: { cpu: String(input.template.cpu), memory: `${input.template.memory}Mi` } };
      const wanted = { apiVersion: "agents.kruise.io/v1alpha1", kind: "SandboxSet", metadata: { name, namespace,
        labels: { "app.kubernetes.io/managed-by": "abx" }, annotations: { ...(base.metadata?.annotations ?? {}), "abx.agent-sandbox.com/project": image } }, spec: { ...base.spec, replicas: 0 } };
      let current;
      try { current = JSON.parse(await run(["get", "sandboxset", name, "--ignore-not-found", "-o", "json"]) || "null"); }
      catch { throw new kit.errors.ProviderConfigError("Cannot check the prepared SandboxSet; no cluster resource was changed."); }
      if (current) {
        if (current.metadata?.annotations?.["abx.agent-sandbox.com/project"] !== image || current.metadata?.labels?.["app.kubernetes.io/managed-by"] !== "abx") throw new kit.errors.ProviderConfigError("Prepared SandboxSet name is owned by another resource; no existing resource was changed.");
      } else {
        try { await run(["create", "-f", "-"], { input: JSON.stringify(wanted) }); }
        catch { throw new kit.errors.ProviderConfigError(`SandboxSet preparation did not confirm creation. Check the owned name ${name} before retrying.`); }
      }
      return { reference: name, status: "ready", metadata: { "e2b.agents.kruise.io/create-on-no-stock": "true" },
        ...(input.template.start_cmd ? { startup_command: input.template.start_cmd } : {}),
        ...(input.template.ready_cmd ? { ready_command: input.template.ready_cmd } : {}) };
    },
  };
}
