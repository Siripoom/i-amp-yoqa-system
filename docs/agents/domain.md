# Domain Docs

How engineering skills should consume this repository's domain documentation.

## Before exploring

- Read `CONTEXT.md` at the repository root when it exists.
- Read ADRs under `docs/adr/` that touch the area being changed.
- If either location does not exist, proceed silently. Domain-modeling creates files lazily when terminology or durable decisions are resolved.

## Layout

This repository uses a single context:

```text
/
|-- CONTEXT.md
|-- docs/
|   `-- adr/
|       `-- 0001-example.md
|-- back-end/
`-- front-end/
```

## Vocabulary

Use canonical terms from `CONTEXT.md` in issue titles, specifications, tests, and implementation. If a needed project-specific term is missing, resolve it through domain modeling before adding it.

## ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly instead of silently overriding the earlier decision.
