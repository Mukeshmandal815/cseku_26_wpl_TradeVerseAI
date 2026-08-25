# TradeVerse AI — Task List (Branch 0.1: Project Initiation)

Version 0.1 — Week 1

This file tracks the tasks for the initiation phase of TradeVerse AI. Each task should be mirrored as a GitHub Issue and linked to the relevant SRS requirement ID where applicable. Checked items are complete on this branch; unchecked items are open.

## Documentation

- [x] Draft the Software Requirements Specification (`TradeVerseAI_proposal-srs.docx`) — Purpose, Objectives, Scope, User Roles, System Features (REQ-UM, REQ-MD, REQ-TE, REQ-PF, REQ-AI, REQ-AL, REQ-AD, REQ-TP), External Interfaces, Non-Functional Requirements, Architecture Overview, Appendix.
- [x] Write `README.md` — problem, solution, architecture, tech stack, setup, and documentation index.
- [ ] Write `CONTRIBUTING.md` — branching strategy, commit conventions, and pull request checklist.
- [ ] Produce the use case diagram in three formats — `usecase-diagram.md` (Mermaid source + traceability table), `use_case diagram.html` (interactive render), `usecase diagram.jpg` (static image).
- [ ] Maintain this task list as the single source of truth for Branch 0.1 scope; update status as items complete.

## Repository Setup

- [ ] Create the GitHub repository and push Branch 0.1 with the files listed above.
- [ ] Add issue labels: `priority:P0`, `priority:P1`, `priority:P2`, `type:frontend`, `type:backend`, `type:ai`, `type:mobile`, `type:docs`.
- [ ] Add issue templates (feature, bug, documentation) and a pull request template.
- [ ] Configure branch protection on `main` requiring at least one review before merge.

## Prototype

- [x] Write `TradeverseAi.py` — a standalone Python proof-of-concept demonstrating the core trading-engine logic (virtual wallet, order validation, order execution, holdings update) ahead of the NestJS/TypeScript implementation.
- [ ] Reimplement the validated logic from `TradeverseAi.py` as the NestJS trading module once Branch 0.2 begins.

## Diagrams and Design (carried into Branch 0.2)

- [ ] `tradeverseAi-web-ui-design-figma` — high-fidelity UI design in Figma, based on the Week 2 wireframes.
- [ ] ER diagram — entity-relationship diagram covering users, stocks, orders, trades, holdings, watchlists, alerts, and predictions.
- [ ] `oxtest` — test suite setup (unit/integration tests for the trading engine and API).

## Definition of Done for Branch 0.1

- [ ] All files above are present in the repository on Branch 0.1.
- [ ] SRS and README are internally consistent (same requirement IDs, same architecture description).
- [ ] Use case diagram traces back to at least one requirement ID per use case.
- [ ] Supervisor feedback (if any) is recorded and reflected before merging Branch 0.1 into `main`.

---

**Next branch:** `0.2` — Figma UI design, test suite (`oxtest`), and the finalized ER diagram, tracked separately from this task list.
