# Implementation Plan: Agent Chat

**Branch**: `003-agent-chat` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-agent-chat/spec.md`

## Summary

Add authenticated owner-only agent chat through `POST /agents/{id}/chat`, returning streamed model output for valid requests. Extend the existing NestJS `agents` module in place: add chat DTOs and controller action, add a `chat-agent` domain service that reuses the agent repository for existence and owner checks, isolate AI SDK/OpenAI response generation behind a service abstraction, load the base A.S.C.A. instruction from `instructions.md`, inject agent role guidance only when no developer message is already supplied, and keep chat history persistence out of scope.

## Technical Context

**Language/Version**: TypeScript 5.7 targeting ES2023 on Node.js 22 types

**Primary Dependencies**: NestJS 11, `@nestjs/testing`, Jest, Supertest, `class-validator`, `class-transformer`, Prisma 7, `@prisma/client`, `@prisma/adapter-better-sqlite3`, `@nestjs/jwt`, AI SDK `ai`, and `@ai-sdk/openai`

**Storage**: Existing Prisma-managed SQLite for development and automated tests; no chat history persistence is introduced

**Testing**: Jest unit tests colocated with controller/service/repository files; Nest e2e tests through `test/jest-e2e.json` and Supertest; response generation isolated behind mocks for unit and e2e reliability

**Target Platform**: Backend web service running as a Node.js/NestJS HTTP application

**Project Type**: Web service

**Performance Goals**: 95% of accepted chat requests should begin streaming visible response content within 3 seconds in the standard development and test environment, excluding response-provider outages; this is tracked as a non-buildable acceptance metric outside required automated verification gates

**Constraints**: All chat requests require bearer JWT authentication; no agent data, role instructions, or model request may be exposed before authentication and owner authorization succeed; services must use domain models and repository/response-generation abstractions only; DTOs, DAOs, and AI SDK provider types must not cross into domain service contracts; `OPENAI_API_KEY` and `ASCA_MODEL` must be configured for real response generation; chat history must not be stored; new or modified behavior requires at least 80% changed-code coverage

**Scale/Scope**: Extend the existing `agents` domain module for owner-only streaming chat. No chat history persistence, tool execution, agent memory, resume streams, production PostgreSQL deployment, multi-agent sharing, UI chat client, or long-term instruction templating is included.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Clean Architecture**: PASS. HTTP concerns remain in `src/agents/controller/`; owner checks and chat orchestration live in `src/agents/service/chat-agent/`; existing agent persistence remains behind `src/agents/repository/agent-store/`; AI SDK/OpenAI calls are isolated behind a response-generation abstraction under `src/agents/service/generate-agent-response/`. Services depend on repository and generator interfaces plus domain models, not DTOs, DAOs, concrete Prisma classes, or concrete provider calls.
- **Test-Driven Development**: PASS. Tasks must add failing controller, service, response-generator, and e2e tests before implementation for successful streamed chat, invalid input, missing/invalid authentication, cross-owner forbidden access, not-found access, role injection, developer-message preservation, provider failure, and no chat-history persistence.
- **Quality Gates**: PASS. Verification will run `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run test:cov`; changed agent chat behavior must meet or exceed 80% coverage.
- **Technical Constraints**: PASS. The plan uses TypeScript/NestJS, `class-validator`, Prisma, SQLite for dev/test, `@nestjs/jwt` authentication, `@nestjs/testing`, explicit public contracts, no `any`, and doc comments on public classes/interfaces/functions. AI SDK integration is added as a provider-side dependency behind a service boundary.
- **Project Structure**: PASS. All feature components map to the existing `src/agents/` module and preserve controller, service, and repository subdirectories. Shared auth and Prisma infrastructure remain unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/003-agent-chat/
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
src/
├── app.module.ts
├── main.ts
└── agents/
    ├── agents.module.ts
    ├── controller/
    │   ├── agent.dto.ts
    │   ├── agents.controller.ts
    │   └── agents.controller.spec.ts
    ├── service/
    │   ├── chat-agent/
    │   │   ├── agent-chat.model.ts
    │   │   ├── chat-agent.service.interface.ts
    │   │   ├── chat-agent.service.ts
    │   │   └── chat-agent.service.spec.ts
    │   ├── generate-agent-response/
    │   │   ├── generate-agent-response.service.interface.ts
    │   │   ├── generate-agent-response.service.ts
    │   │   ├── generate-agent-response.service.spec.ts
    │   │   └── instructions.md
    │   └── manage-agents/
    │       ├── agent.model.ts
    │       ├── manage-agents.service.interface.ts
    │       ├── manage-agents.service.ts
    │       └── manage-agents.service.spec.ts
    └── repository/agent-store/
        ├── agent.dao.ts
        ├── agent-store.repository.interface.ts
        ├── prisma-agent-store.repository.ts
        └── prisma-agent-store.repository.spec.ts

test/
└── agents.e2e-spec.ts
```

**Structure Decision**: Continue using the existing `src/agents/` module. Add chat request/response DTOs in `controller/agent.dto.ts` and a `POST /agents/{id}/chat` action in `AgentsController`. Add a new `chat-agent` service capability for authenticated owner-only chat orchestration. Reuse `AgentStoreRepository.findById` for not-found and forbidden decisions, and add no new persistence methods because chat history is out of scope. Add a `generate-agent-response` service capability for instruction loading, role/developer-message preparation, AI SDK/OpenAI configuration, and stream creation. Register both service abstractions in `agents.module.ts`.

## Phase 0: Research Summary

Detailed decisions are recorded in [research.md](./research.md). No `NEEDS CLARIFICATION` items remain.

## Phase 1: Design Summary

- Data model is recorded in [data-model.md](./data-model.md).
- External HTTP contract is recorded in [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml).
- End-to-end validation guide is recorded in [quickstart.md](./quickstart.md).
- Agent context points to this plan through the managed `AGENTS.md` Spec Kit block.

## Post-Design Constitution Check

- **Clean Architecture**: PASS. Data model and contract artifacts keep DTO/domain/generator/persistence boundaries explicit, and the planned source layout prevents service dependency on controller, DAO, Prisma implementation, or AI SDK provider types.
- **Test-Driven Development**: PASS. Quickstart defines failing tests before implementation for authentication, authorization, validation, response streaming, instruction behavior, provider errors, and persistence exclusion.
- **Quality Gates**: PASS. Quickstart includes lint, unit, e2e, and coverage verification commands with the 80% changed-code coverage target.
- **Technical Constraints**: PASS. Artifacts retain TypeScript/NestJS, `class-validator`, Prisma, SQLite, `@nestjs/jwt` authentication, `@nestjs/testing`, explicit typing, no `any`, public-doc-comment requirements, and isolated AI SDK provider integration.
- **Project Structure**: PASS. Planned files follow module-local controller/service/repository boundaries and isolate shared auth/prisma infrastructure.

## Complexity Tracking

No constitution violations require justification.
