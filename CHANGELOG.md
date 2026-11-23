# Changelog

## v0.1.0 - 2026-11-22

Split out of pi-secret-broker 0.3, unchanged in behaviour. Other extensions reach it through
`globalThis[Symbol.for("pi-redaction.v1")]` (`redact`, `rememberSecret`).
