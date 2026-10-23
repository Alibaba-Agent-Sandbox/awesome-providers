# Changelog

## Unreleased

- Declare exact operations separately for CLI and Python, accepted workflow inputs and startup modes; remove the coarse interpreter feature.
- Keep OpenSandbox unified interpretation explicitly unimplemented. Declare E2B contexts separately; Cube/container support persistent default-context execution without contexts or live callbacks.
- Remove hidden Dockerfile base/user/copy rewrites and image-name entrypoint inference. Require persistent preparation intents and report retained artifacts with manual recovery.
- Bind OpenSandbox endpoint identity, preserve proxy queries, disable redirects and refuse non-idempotent replay after uncertain responses.
