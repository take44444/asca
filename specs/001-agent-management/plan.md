# Implementation Plan: Agent Management

**Branch**: `001-agent-management` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-agent-management/spec.md`

## Summary

Add authenticated agent management for creating, listing, and deleting user-owned agents. Implement a NestJS `agents` domain module with controller, service/domain, and repository boundaries; validate JWT bearer authentication using the configured authentication secret; persist agents through Prisma with SQLite for development and tests; and expose the `/agents` collection plus individual-agent delete contract.

## Technical Context

**Language/Version**: TypeScript 5.7 targeting ES2023 on Node.js 22 types

**Primary Dependencies**: NestJS 11, `@nestjs/testing`, Jest, Supertest; add `class-validator`, `class-transformer`, Prisma, `@prisma/client`, and `@nestjs/jwt` for bearer JWT verification

**Storage**: Prisma-managed SQLite for development and automated tests; schema must remain portable to PostgreSQL for production follow-up

**Testing**: Jest unit tests colocated with controller/service/repository files; Nest e2e tests through `test/jest-e2e.json` and Supertest

**Target Platform**: Backend web service running as a Node.js/NestJS HTTP application

**Project Type**: Web service

**Performance Goals**: Authenticated create, list, and delete requests complete within the user-facing 30-second create-and-confirm success criterion; normal local and CI test requests should complete within 1 second per operation

**Constraints**: All agent actions require bearer JWT authentication; no agent data may be read or changed before authentication succeeds; services must use domain models and repository abstractions only; DTOs and DAOs must not cross into the service layer; new or modified behavior requires at least 80% changed-code coverage

**Scale/Scope**: Single `agents` domain module for create, list, and delete behavior; no production PostgreSQL deployment work; no shared agents, updates, search, pagination, or role management in this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Clean Architecture**: PASS. The feature will use `src/agents/controller/` for HTTP and DTO concerns, `src/agents/service/manage-agents/` for domain behavior and ownership rules, and `src/agents/repository/agent-store/` for Prisma data access behind a repository interface. The service will depend on repository and authentication abstractions, not concrete persistence or transport types.
- **Test-Driven Development**: PASS. Tasks must create failing controller, service, repository, and e2e tests before implementation. Initial failures should prove missing create/list/delete behavior, authentication rejection, validation rejection, and ownership scoping.
- **Quality Gates**: PASS. Verification will run `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run test:cov`; changed agent-management behavior must meet or exceed 80% coverage.
- **Technical Constraints**: PASS. The plan uses TypeScript/NestJS, `class-validator`, Prisma, SQLite for dev/test, `@nestjs/jwt` authentication, `@nestjs/testing`, explicit public contracts, no `any`, explicit types, and doc comments on public classes/interfaces/functions.
- **Project Structure**: PASS. All feature components map to `src/agents/` with controller, service, and repository subdirectories. Shared infrastructure is limited to authentication and Prisma provider modules needed by the feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-management/
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
├── auth/
│   ├── auth.module.ts
│   ├── controller/
│   │   └── authenticated-user.decorator.ts
│   └── service/verify-auth-token/
│       ├── authenticated-user.model.ts
│       ├── verify-auth-token.service.interface.ts
│       ├── verify-auth-token.service.ts
│       └── verify-auth-token.service.spec.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
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

**Structure Decision**: Use one domain module, `src/agents/`, for agent management. Keep JWT verification in `src/auth/` because authentication is cross-cutting but still service-backed and testable. Keep Prisma connection setup in `src/prisma/`; agent-specific Prisma queries remain in the agent repository implementation. This preserves the required dependency direction: controller -> service interface/domain model -> repository interface -> repository implementation/DAO.

## Phase 0: Research Summary

Detailed decisions are recorded in [research.md](./research.md). No `NEEDS CLARIFICATION` items remain.

## Phase 1: Design Summary

- Data model is recorded in [data-model.md](./data-model.md).
- External HTTP contract is recorded in [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml).
- End-to-end validation guide is recorded in [quickstart.md](./quickstart.md).
- Agent context must point to this plan through the managed `AGENTS.md` Spec Kit block.

## Post-Design Constitution Check

- **Clean Architecture**: PASS. Data model and contract artifacts keep DTO/DAO/domain boundaries explicit, and the planned source layout prevents service dependency on controller or concrete repository implementations.
- **Test-Driven Development**: PASS. Quickstart and research artifacts define behavior that will become failing tests before implementation.
- **Quality Gates**: PASS. Quickstart includes lint, unit, e2e, and coverage verification commands with the 80% changed-code coverage target.
- **Technical Constraints**: PASS. Artifacts retain TypeScript/NestJS, `class-validator`, Prisma, SQLite, `@nestjs/jwt` authentication, `@nestjs/testing`, explicit typing, no `any`, and doc-comment requirements.
- **Project Structure**: PASS. Planned files follow module-local controller/service/repository boundaries and isolate shared auth/prisma infrastructure.

## Complexity Tracking

No constitution violations require justification.
