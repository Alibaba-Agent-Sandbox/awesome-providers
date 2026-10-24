# OpenSandbox public endpoint authentication probe

Result: PARTIAL

The initial public pilot failed at template launch with server proxy enabled:
https://github.com/Alibaba-Agent-Sandbox/awesome-templates/actions/runs/40107869809 .
It confirmed its owned resources absent but retained only a generic exit code.
Do not infer a complete root cause from that receipt.

The native T4 follow-up uses exact published host source refs: CLI
`25e22d8f5c38bb0b7636ba699511da4f4695ec48`, paired Python SDK
`6398c6fdd777ff6c8ae9c7b2acb4cc52d457a633`, and template
`295aff8f45f710eadf46d164b7ce4150b2c914ec` (`python-hello`).
The existing real default launch creates one sandbox. The opt-in diagnostic resolves
both direct and proxy endpoints through the public lifecycle API and sends the same
application credential using Bearer and the existing X-Access-Token header. It never
overrides a gateway credential or discovers a Docker bridge address. Only HTTP status
and expected application results are emitted. Existing owned cleanup still runs.

The expected pinned-server behavior is a hypothesis until that run completes:
direct Bearer 200, proxy Bearer 401, proxy X-Access-Token 200. This diagnostic does not
change provider/client authentication or mark proxy support as accepted.

Local PASS: JavaScript syntax and diff checks. Real follow-up result pending at this
checkpoint; original direct acceptance receipts remain unchanged.
