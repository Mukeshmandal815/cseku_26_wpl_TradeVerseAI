# Contributing to TradeVerse AI

Thanks for contributing to TradeVerse AI — a virtual NEPSE stock-trading and AI market-analysis platform built as a course project for Web Programming & Mobile Applications Development, CSE Discipline, Khulna University.

This guide covers branching, commit conventions, and the pull request checklist. For the functional/non-functional requirement set, see `TradeVerseAI_proposal-srs.docx`.

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, reviewed work only. |
| `0.1` | Project initiation: SRS, README, use case diagram, task list, initial prototype. |
| `0.2` | UI design (Figma), test suite (`oxtest`), and the finalized ER diagram. |
| `feature/<topic>` | New functionality, branched from the current working branch. |
| `fix/<topic>` | Bug fixes. |
| `docs/<topic>` | Documentation-only changes. |

Branch names use lowercase, hyphen-separated topics, e.g. `feature/order-validation`, `fix/watchlist-duplicate`, `docs/api-contract`.

## Commit Conventions

Use concise, conventional-style commit messages:

```
feat(api): add order validation endpoint
fix(trading): correct average price recalculation on partial fills
docs(srs): update non-functional requirements table
chore(ci): add lint step to GitHub Actions
```

Prefixes: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

## Pull Request Checklist

Before opening a pull request, confirm:

- [ ] The PR links to a GitHub Issue or requirement ID (e.g. `REQ-TE-02`).
- [ ] Scope matches the linked issue — no unrelated refactoring bundled in.
- [ ] Local setup or the relevant test command has been run.
- [ ] Documentation (`README.md`, `docs/`, or the SRS) is updated if behavior or setup changed.
- [ ] No secrets, credentials, or `.env` files are included — only `.env.example` should ever be committed.
- [ ] UI changes include a screenshot or short description of the visible result.

At least one other team member should review any change that affects requirements, architecture, the trading engine, or shared/cross-cutting code.

## Code Review Expectations

- Be specific: point to the line or requirement in question rather than general feedback.
- Prefer suggesting an alternative over only flagging a problem.
- Trading-logic changes (order validation, balance updates, price execution) require extra scrutiny — these are backend-authoritative by design (Section 2.5 of the SRS) and must never trust client-submitted values.
- AI-related changes must preserve the "insufficient data" fallback and the experimental/educational labelling on all AI output (REQ-AI-05, REQ-AI-06).

## Getting Help

If a task is unclear, open a draft issue describing what's blocking you rather than guessing at scope — this keeps the requirement traceability in `task.md` and the SRS accurate.
