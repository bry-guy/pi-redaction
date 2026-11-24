# pi-redaction

Best-effort secret redaction for [pi](https://github.com/earendil-works/pi). In every session (sandboxed or not, with
or without a project or role), secret values in tool output are replaced by `[redacted:<kind>]` before they reach the
transcript or the model.

```sh
pi install npm:@bry-guy/pi-redaction
# or from git:
pi install git:github.com/bry-guy/pi-redaction
```

It is a text filter, not a sandbox: commands still run with the real values. It only scrubs what comes back.

## What is redacted

- **Known values**: env vars of the pi process whose name looks secret (`token`, `secret`, `password`, `credential`,
  `api_key`, `private_key`, ...; 8+ chars, not a path or a plain URL), and values other extensions registered.
- **Token shapes**: GitHub, Anthropic, OpenAI-style, Slack, AWS access key ids, 1Password service-account tokens,
  JWTs and PEM private key blocks (`PATTERNS` in `src/redact.ts`).
- **`NAME=value` lines** with a secret-looking name, in bash output, `!command` output and reads of dotenv files
  (`.env`, `.env.*`, `.envrc`, `*.env`; not `.env.example`/`.sample`/`.template`). The name stays, the value goes.
  Source files are left readable.
- Any value caught by the last two rules is remembered (up to 500) and redacted wherever it shows up later.

## Where it runs

On `tool_result`, on `!command` output, and on every request's messages (`context`, as a backstop). `write` and `edit`
calls that would put a `[redacted:` marker into a file are blocked, so a marker never replaces the real value on disk.

Since `!command` output is filtered by running the command through pi's local shell, an extension that runs `!`
commands elsewhere must load before this one.

## For other extensions

`globalThis[Symbol.for("pi-redaction.v1")]` has:

- `redact(text)`: the text with secrets replaced.
- `rememberSecret(kind, value)`: redact this value from now on, as `[redacted:<kind>]`.
  [pi-secret-broker](https://github.com/bry-guy/pi-secret-broker) registers every role secret it resolves.

## Limits

This is hygiene, not a security boundary. Not covered: encoded or transformed secrets (base64, split, escaped),
values under 8 characters, secrets with no telltale name or shape (a password inside `DATABASE_URL`, `password: x` in
YAML), Kubernetes Secret `data` blobs, live partial output shown in the terminal while a command runs, pi's on-disk
bash full-output logs, and model thinking blocks. A secret you type yourself (in a message or after `!`) or that the
model writes into a command is stored as typed in the session file; it is only redacted on its way to the model.
