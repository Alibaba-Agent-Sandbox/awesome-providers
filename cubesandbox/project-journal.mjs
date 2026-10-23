/** Persist intent before side effects and retain only resources created by this invocation. */
export function projectJournal(input, errors) {
  if (!input.journal || typeof input.journal.intent !== "function" || typeof input.journal.created !== "function") {
    throw new errors.ProviderConfigError("Project preparation requires a persistent ownership journal.");
  }
  const intents = new Map();
  const resources = [];
  const journal = {
    async intent(record) {
      const id = await input.journal.intent(record);
      intents.set(id, record);
      return id;
    },
    async created(intent_id, id) {
      const record = intents.get(intent_id);
      if (!record) throw new errors.ProviderConfigError("Creation response has no persisted ownership intent.");
      await input.journal.created(intent_id, id);
      resources.push({ intent_id, kind: record.kind, id, cleanup: record.cleanup, owned: true });
    },
  };
  return { journal, resources };
}
