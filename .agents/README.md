# Engineering records: awesome-providers

This version-controlled directory records changes owned by this repository.
Records are written in English; credentials and raw sensitive logs are excluded.

- `notes/proposed/<category>/YYYY-MM-DD-<slug>.md`: decisions pending acceptance.
- `notes/implemented/<category>/YYYY-MM-DD-<slug>.md`: accepted decisions reflected in code.
- `evidence/verify/YYYY-MM-DD-<slug>.md`: immutable point-in-time verification evidence.

Categories are `architecture`, `feature` and `process`. Move a note and update its
`Status:` together when its acceptance state changes. Local code does not prove a
PR merged. A later verification run receives a new evidence file.

Every change includes a decision note and evidence recording the tested revision or
scoped files, actual commands and outcomes, limitations and resource cleanup. Use
`Result: PASS | PARTIAL | BLOCKED | FAIL`; missing mandatory checks prevent completion.
Mock and real-backend results are separate claims. Cross-repository dependencies use
absolute GitHub URLs so a standalone checkout retains its context.
