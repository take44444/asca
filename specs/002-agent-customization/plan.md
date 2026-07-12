# Implementation Plan: Agent Customization

**Branch**: `002-agent-customization` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-agent-customization/spec.md`

## Summary

Add authenticated agent customization for owner-only single-agent retrieval and partial updates to agent name and role instructions. Extend the existing NestJS `agents` module in place: add role persistence to the Agent model, expose `GET /agents/{id}` and `PATCH /agents/{id}`, preserve lightweight list responses without role content, and keep controller, service/domain, and repository boundaries aligned with the existing agent management architecture.

## Technical Context

**Language/Version**: TypeScript 5.7 targeting ES2023 on Node.js 22 types

**Primary Dependencies**: NestJS 11, `@nestjs/testing`, Jest, Supertest, `class-validator`, `class-transformer`, Prisma 7, `@prisma/client`, `@prisma/adapter-better-sqlite3`, and `@nestjs/jwt`

**Storage**: Prisma-managed SQLite for development and automated tests; schema remains portable to PostgreSQL for production follow-up

**Testing**: Jest unit tests colocated with controller/service/repository files; Nest e2e tests through `test/jest-e2e.json` and Supertest

**Target Platform**: Backend web service running as a Node.js/NestJS HTTP application

**Project Type**: Web service

**Performance Goals**: 95% of single-agent retrieval and update requests should complete in under 1 second in local and CI-like test environments; this is tracked as a non-buildable acceptance metric outside this feature's required automated verification gates

**Constraints**: All retrieval and update actions require bearer JWT authentication; no role data may be returned before authentication and owner authorization succeed; services must use domain models and repository abstractions only; DTOs and DAOs must not cross into the service layer; new or modified behavior requires at least 80% changed-code coverage

**Scale/Scope**: Extend the existing `agents` domain module for role persistence, single-agent detail retrieval, and owner-only partial update. No production PostgreSQL deployment, search, pagination, shared agents, role templating, role validation beyond text shape, or agent execution behavior is included.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Clean Architecture**: PASS. HTTP concerns remain in `src/agents/controller/`, behavior and owner rules remain in `src/agents/service/manage-agents/`, and persistence remains behind `src/agents/repository/agent-store/`. The service will depend on the repository interface and domain models, not DTOs, DAOs, or concrete Prisma implementation details.
- **Test-Driven Development**: PASS. Tasks must add failing controller, service, repository, and e2e tests before implementation for successful retrieval, successful update, name-only update, role-only update, invalid update payloads, missing authentication, cross-owner forbidden access, not-found access, and unchanged list response shape.
- **Quality Gates**: PASS. Verification will run `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run test:cov`; changed agent customization behavior must meet or exceed 80% coverage.
- **Technical Constraints**: PASS. The plan uses TypeScript/NestJS, `class-validator`, Prisma, SQLite for dev/test, `@nestjs/jwt` authentication, `@nestjs/testing`, explicit public contracts, no `any`, explicit types, and doc comments on public classes/interfaces/functions.
- **Project Structure**: PASS. All feature components map to the existing `src/agents/` module and preserve controller, service, and repository subdirectories. Shared auth and Prisma infrastructure remain unchanged except where the Agent persistence schema is extended.

## Project Structure

### Documentation (this feature)

```text
specs/002-agent-customization/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── agents.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma

src/
├── app.module.ts
├── main.ts
└── agents/
    ├── agents.module.ts
    ├── controller/
    │   ├── agent.dto.ts
    │   ├── agents.controller.ts
    │   └── agents.controller.spec.ts
    ├── service/manage-agents/
    │   ├── agent.model.ts
    │   ├── manage-agents.service.interface.ts
    │   ├── manage-agents.service.ts
    │   └── manage-agents.service.spec.ts
    └── repository/agent-store/
        ├── agent.dao.ts
        ├── agent-store.repository.interface.ts
        ├── prisma-agent-store.repository.ts
        └── prisma-agent-store.repository.spec.ts

test/
└── agents.e2e-spec.ts
```

**Structure Decision**: Continue using the existing `src/agents/` module. Add DTOs for update and detail responses in `controller/agent.dto.ts`; add `get` and `update` service capabilities to `service/manage-agents/`; add repository methods for lookup by id and owner-aware update to `repository/agent-store/`; extend `prisma/schema.prisma` with role persistence. This keeps dependency direction controller -> service interface/domain model -> repository interface -> repository implementation/DAO.

## Phase 0: Research Summary

Detailed decisions are recorded in [research.md](./research.md). No `NEEDS CLARIFICATION` items remain.

## Phase 1: Design Summary

- Data model is recorded in [data-model.md](./data-model.md).
- External HTTP contract is recorded in [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml).
- End-to-end validation guide is recorded in [quickstart.md](./quickstart.md).
- Agent context points to this plan through the managed `AGENTS.md` Spec Kit block.

## Post-Design Constitution Check

- **Clean Architecture**: PASS. Data model and contract artifacts keep DTO/DAO/domain boundaries explicit, and the planned source layout prevents service dependency on controller or concrete repository implementations.
- **Test-Driven Development**: PASS. Quickstart and research artifacts define behavior that will become failing tests before implementation, including unauthorized, forbidden, invalid, not-found, and success paths.
- **Quality Gates**: PASS. Quickstart includes lint, unit, e2e, and coverage verification commands with the 80% changed-code coverage target.
- **Technical Constraints**: PASS. Artifacts retain TypeScript/NestJS, `class-validator`, Prisma, SQLite, `@nestjs/jwt` authentication, `@nestjs/testing`, explicit typing, no `any`, and public-doc-comment requirements.
- **Project Structure**: PASS. Planned files follow module-local controller/service/repository boundaries and isolate shared auth/prisma infrastructure.

## Complexity Tracking

No constitution violations require justification.
