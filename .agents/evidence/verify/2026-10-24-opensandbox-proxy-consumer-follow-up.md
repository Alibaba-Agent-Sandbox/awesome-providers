# OpenSandbox proxy consumer follow-up

Result: PARTIAL

Scope: exact-ref native default, portable and explicit-proxy checks, uniform compatible
host minimum, and documentation. No provider runtime implementation or server protocol changed.
Frozen inputs: CLI `80c45cd2594d0fc997badfd31246d60ffa434de5` (0.4.16 candidate),
paired Python SDK `588d126af9310ee5536ea631856b092b84c6ce6b` (0.3.1a4 candidates),
independent Node SDK `344d297df816063b6580d7f2bb34180111ad9a54` (source0.1.0; no npm
publication claim), templates `295aff8f45f710eadf46d164b7ce4150b2c914ec`.

The workflow keeps default/direct and portable cases, then explicitly enables server
proxy for a full CLI launch, CLI named command, Python application client and prepared
image workflow. The independent Node ServerClient calls a named command through the
normal proxy endpoint. Raw Bearer-only401 remains the pinned upstream observation;
existing X-Access-Token200 and wrong-token401 are checked separately. Gateway headers
are retained and never replaced by the probe. Owned cleanup runs after every attempt.

Local PASS: JavaScript syntax, YAML parse and diff checks. Native follow-up pending at
commit time. The previous exact three-way observation remains in its separate receipt.
The raised host floor cannot merge before compatible CLI/SDK packages are actually published.
