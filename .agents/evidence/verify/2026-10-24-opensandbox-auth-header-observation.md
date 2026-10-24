# Observed OpenSandbox1.1.1 application authentication behavior

Result: PASS

This result records a protocol observation, not acceptance of the Bearer-only proxy path.
[Run40109164062](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40109164062)
used provider `84c54980f5712bb7dfedee6d90ef9d50aee82898`, CLI
`25e22d8f5c38bb0b7636ba699511da4f4695ec48`, paired Python SDK
`6398c6fdd777ff6c8ae9c7b2acb4cc52d457a633`, and templates
`295aff8f45f710eadf46d164b7ce4150b2c914ec`.

The unchanged default python-hello recipe launched on the actual Docker-backed
OpenSandbox1.1.1 server. For the same owned sandbox and application credential,
normal public lifecycle endpoints resolved the following actual host requests:

| Endpoint | Application credential header | Observed status |
| --- | --- | --- |
| Direct | Authorization: Bearer | 200 |
| Server proxy | Authorization: Bearer | 401 |
| Server proxy | X-Access-Token | 200 |

Each200 response also returned the exact expected named-command result. The probe
never overwrote a provider gateway credential or used a discovered Docker bridge
address. It emitted numeric status only; dynamic URLs, credentials and native IDs
were excluded from the preserved report. Default and portable CLI/Python native
acceptance also passed in that run. Final independent cleanup confirmed no sandbox
containers remained and removed the job-owned registry.

The existing X-Access-Token header is sufficient for this application through the
pinned proxy. Consumer compatibility changes and their real proxy regression remain
separate work; no provider/server protocol was changed for this observation.
Refs https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/31 .

[Exact sanitized result](2026-10-24-opensandbox-auth-header-observation.json).
The original failed public-entry attempt remains preserved in the templates owner.
