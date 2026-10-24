# OpenSandbox three-consumer proxy acceptance

Result: PASS

[Run 40110372103](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40110372103)
passed at provider `65d8e5a9c130f424c05a662fe430b0eb04793c0e` with
CLI `80c45cd2594d0fc997badfd31246d60ffa434de5`, paired Python SDK
`588d126af9310ee5536ea631856b092b84c6ce6b`, independent Node SDK
`344d297df816063b6580d7f2bb34180111ad9a54`, and templates
`295aff8f45f710eadf46d164b7ce4150b2c914ec`.

Three real python-hello workflows passed: default/direct, portable/direct, and
default/server-proxy. Each built and pushed its source recipe, launched through CLI,
called its named HTTP command from CLI and Python, and completed the Python
prepared-image workflow. Two independent Node ServerClient calls through the proxy
also passed. The source-installed CLI/SDK candidates and local provider checkout
are not public-package installation evidence; Node npm publication is not claimed.

Two raw probes independently returned direct Bearer200, proxy Bearer401 and proxy
X-Access-Token200, with exact expected successful response bodies. Wrong application
X-Access-Token401 was also asserted. Existing gateway headers were never replaced.
This preserves the upstream Bearer-stripping observation while validating the
clients' existing-header compatibility fix. It does not add an authentication
protocol or relax authorization.

Each case completed owned cleanup. The separate final Docker cleanup step passed
and independently confirmed no sandbox containers remained; the owned disposable
image registry was removed. Scope is python-hello, not all46 templates.

The [sanitized receipt](2026-10-24-opensandbox-proxy-consumers-pass.json) contains
only exact source refs, controlled success markers, HTTP statuses and cleanup result.
No raw logs, tokens or native resource identifiers are included. Earlier partial
planning and failed pilot reports remain unchanged. Compatible public CLI0.4.16 and
Python0.3.1a4 publication still gates merging the raised provider minimum.
