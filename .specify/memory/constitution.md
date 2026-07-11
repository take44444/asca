<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0
- Modified principles:
  - Technical Constraints: Auth.js authorization → @nestjs/jwt authentication
- Added sections: none
- Removed sections: none
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ✅ reviewed: .specify/templates/commands/*.md (directory not present)
  - ✅ reviewed: README.md
- Follow-up TODOs: none
-->
# A.S.C.A. Backend Constitution

## Core Principles

### I. Clean Architecture
Presentation, business logic, and data access MUST remain separate. Controllers MUST
perform transport concerns only and delegate business behavior to services. Services MUST
not depend on presentation types or implementations and MUST depend only on repository
abstractions rather than concrete repository implementations.
Repositories MUST own database and external data-source interactions, implement abstractions
consumed by services, and contain no business logic. Dependency flow MUST NOT point from the
service layer to concrete presentation or data-access implementations.

Services MUST express business entities and behavior through domain models. DTOs and DAOs
MUST NOT cross into the service layer. These boundaries keep core behavior independent of
framework, transport, and persistence choices and make it independently testable.

### II. Test-Driven Development (NON-NEGOTIABLE)
Every feature and bug fix MUST follow Red-Green-Refactor: write a test from the requirement,
verify that it fails for the expected reason, implement the minimum behavior needed to pass,
then refactor while the suite remains green. Each behavior change MUST include tests that
demonstrate the new or corrected behavior. Implementation MUST NOT precede its defining test.

This sequence provides executable evidence that tests can detect the missing behavior and
prevents unverified production changes.

### III. Quality Gates
Before code is merged, all applicable lint checks and tests MUST pass, changed code MUST
conform to project coding standards, and new or modified behavior MUST achieve at least 80%
code coverage. Coverage MUST be measured for the feature or fix rather than inferred solely
from repository-wide coverage. A failed gate blocks merge unless an exception is documented
and approved under Governance.

These gates establish a consistent, measurable baseline for correctness and maintainability.

## Technical Constraints

The backend MUST use TypeScript and NestJS. Input validation MUST use `class-validator`.
Repository and database access MUST use Prisma. Production persistence MUST use PostgreSQL;
development and automated tests MUST use SQLite unless a test specifically verifies
PostgreSQL behavior. Authentication MUST use `@nestjs/jwt`, and NestJS tests MUST use
`@nestjs/testing` where framework integration is involved.

Code MUST follow the Google TypeScript Style Guide. Classes, interfaces, constants,
variables, function parameters, and return values MUST have explicit types. The `any` type
MUST NOT be used. Every public class, interface, and function MUST include a doc comment that
describes its contract.

## Development Workflow and Project Structure

Each domain module MUST live directly under `src/<module-name>/` and contain `controller/`,
`service/`, and `repository/` boundaries. Controllers and their DTOs belong in
`controller/`. Each service capability belongs in a nested service directory containing its
interface, domain model, implementation, and colocated specification. Each repository
capability belongs in a nested repository directory containing its interface, DAO,
environment-specific implementations where required, and colocated specification.

Plans MUST document how dependency direction and domain-model isolation will be preserved.
Specifications MUST define independently testable acceptance behavior. Task lists MUST place
failing test creation before implementation and MUST include lint, test, and changed-code
coverage verification. Reviews MUST verify architecture boundaries, test-first evidence,
explicit typing, public API documentation, and all quality gates before approval.

## Governance

This constitution supersedes all other project practices and preferences. Any deviation MUST
be documented with its scope and rationale and approved by project maintainers before merge.
The approval MUST state whether the deviation is temporary and, if so, include a removal or
migration plan.

Amendments MUST include the reason, exact rule changes, approval by project maintainers, the
amendment date, and a migration plan when existing code or workflow is affected. Constitution
versions follow semantic versioning: MAJOR for incompatible governance or principle changes,
MINOR for new principles or materially expanded obligations, and PATCH for clarifications
that do not change obligations.

Every implementation plan MUST pass the Constitution Check before research and again after
design. Every pull request review MUST verify applicable constitutional rules and record any
approved exception. Maintainers MUST review constitution compliance when amending this
document and when recurring exceptions indicate that a rule or implementation needs change.

**Version**: 2.0.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-12
