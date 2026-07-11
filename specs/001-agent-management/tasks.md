# Tasks: Agent Management

**Input**: Design documents from `/specs/001-agent-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agents.openapi.yaml, quickstart.md

**Tests**: Required by the project constitution. Test tasks precede implementation tasks and include explicit failure verification before implementation.

**Organization**: Tasks are grouped by independently testable user story. User Story 4 is a P1 prerequisite because every management route must reject unauthenticated access before touching agent data.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies, Prisma scaffolding, and feature directories required by every story.

- [X] T001 Install validation, `@nestjs/jwt`, and Prisma dependencies in package.json and package-lock.json
- [X] T002 Create Prisma schema with SQLite datasource and Agent model in prisma/schema.prisma
- [X] T003 [P] Create Prisma module and service skeleton in src/prisma/prisma.module.ts and src/prisma/prisma.service.ts
- [X] T004 [P] Create auth module directory structure in src/auth/auth.module.ts and src/auth/service/verify-auth-token/verify-auth-token.service.interface.ts
- [X] T005 [P] Create agents module directory structure in src/agents/agents.module.ts, src/agents/controller/, src/agents/service/manage-agents/, and src/agents/repository/agent-store/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared application wiring and domain/repository boundaries that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Define AuthenticatedUser domain model in src/auth/service/verify-auth-token/authenticated-user.model.ts
- [X] T007 [P] Define Agent domain model in src/agents/service/manage-agents/agent.model.ts
- [X] T008 [P] Define Agent DAO type in src/agents/repository/agent-store/agent.dao.ts
- [X] T009 Define AgentStoreRepository interface with create, listByAuthor, and deleteByIdAndAuthor contracts in src/agents/repository/agent-store/agent-store.repository.interface.ts
- [X] T010 Define ManageAgentsService interface with create, list, and delete contracts in src/agents/service/manage-agents/manage-agents.service.interface.ts
- [X] T011 Wire PrismaModule, AuthModule, and AgentsModule imports in src/app.module.ts and src/agents/agents.module.ts

**Checkpoint**: Foundation ready; user-story tests and implementation can proceed.

---

## Phase 3: User Story 4 - Reject Unauthenticated Agent Management (Priority: P1)

**Goal**: Missing, malformed, invalid, or unverifiable bearer tokens are rejected for create, list, and delete before any repository operation runs.

**Independent Test**: Attempt POST /agents, GET /agents, and DELETE /agents/:id without a token and with an invalid token; verify 401 responses and verify the agent repository is not called.

### Tests for User Story 4 (REQUIRED)

- [X] T012 [P] [US4] Write verify-token service tests for missing, malformed, invalid, and valid JWT outcomes in src/auth/service/verify-auth-token/verify-auth-token.service.spec.ts
- [X] T013 [P] [US4] Write controller authorization tests proving POST /agents, GET /agents, and DELETE /agents/:id reject unauthenticated requests before service calls in src/agents/controller/agents.controller.spec.ts
- [X] T014 [P] [US4] Write e2e tests for unauthenticated and invalid-token POST /agents, GET /agents, and DELETE /agents/test-id requests, including assertions that seeded agent data remains unchanged after rejected requests, in test/agents.e2e-spec.ts
- [X] T015 [US4] Run US4 tests with npm test and npm run test:e2e and verify they fail for missing authentication behavior in src/auth/service/verify-auth-token/verify-auth-token.service.spec.ts, src/agents/controller/agents.controller.spec.ts, and test/agents.e2e-spec.ts

### Implementation for User Story 4

- [X] T016 [US4] Implement `@nestjs/jwt` bearer verification using AUTH_SECRET in src/auth/service/verify-auth-token/verify-auth-token.service.ts
- [X] T017 [US4] Implement authenticated-user decorator or guard helper that exposes AuthenticatedUser to controllers in src/auth/controller/authenticated-user.decorator.ts
- [X] T018 [US4] Implement guarded AgentsController route skeletons for POST /agents, GET /agents, and DELETE /agents/:id in src/agents/controller/agents.controller.ts
- [X] T019 [US4] Register auth and agent providers in src/auth/auth.module.ts and src/agents/agents.module.ts
- [X] T020 [US4] Run US4 tests with npm test and npm run test:e2e and confirm authentication rejection passes in src/auth/service/verify-auth-token/verify-auth-token.service.spec.ts, src/agents/controller/agents.controller.spec.ts, and test/agents.e2e-spec.ts

**Checkpoint**: Agent management routes reject unauthenticated requests without reading or changing agent data.

---

## Phase 4: User Story 1 - Create Own Agent (Priority: P1) - MVP

**Goal**: An authenticated user creates a named agent associated with their email and receives id, name, and author.

**Independent Test**: Submit an authenticated POST /agents request with a non-empty name and verify 201 with id, name, and author; submit missing, empty, or whitespace-only names and verify 400 with no repository create.

### Tests for User Story 1 (REQUIRED)

- [X] T021 [P] [US1] Write controller tests for valid create and invalid name payloads in src/agents/controller/agents.controller.spec.ts
- [X] T022 [P] [US1] Write service tests for creating an agent with authenticated email and rejecting blank names in src/agents/service/manage-agents/manage-agents.service.spec.ts
- [X] T023 [P] [US1] Write repository tests for persisting id, name, and author email in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts
- [X] T024 [P] [US1] Write e2e tests for authenticated create and invalid create payloads in test/agents.e2e-spec.ts
- [X] T025 [US1] Run US1 tests with npm test and npm run test:e2e and verify they fail for missing create behavior in src/agents/ and test/agents.e2e-spec.ts

### Implementation for User Story 1

- [X] T026 [US1] Add create DTO with class-validator validation that rejects missing, empty, or whitespace-only names after trimming in src/agents/controller/agent.dto.ts
- [X] T027 [US1] Implement create business behavior and domain mapping in src/agents/service/manage-agents/manage-agents.service.ts
- [X] T028 [US1] Implement Prisma create persistence and DAO mapping in src/agents/repository/agent-store/prisma-agent-store.repository.ts
- [X] T029 [US1] Implement POST /agents response mapping and validation pipe behavior in src/agents/controller/agents.controller.ts and src/main.ts
- [X] T030 [US1] Run US1 tests with npm test and npm run test:e2e and confirm create behavior passes in src/agents/ and test/agents.e2e-spec.ts

**Checkpoint**: MVP create flow works independently for authenticated users.

---

## Phase 5: User Story 2 - List Own Agents (Priority: P2)

**Goal**: An authenticated user lists only agents authored by their email, with empty lists returned successfully.

**Independent Test**: Seed agents for two authenticated emails, request GET /agents as one user, and verify only that user's agent summaries are returned; request as a user with no agents and verify an empty array.

### Tests for User Story 2 (REQUIRED)

- [X] T031 [P] [US2] Write controller tests for owned-only list response and empty list response in src/agents/controller/agents.controller.spec.ts
- [X] T032 [P] [US2] Write service tests for author-scoped listing and response summary mapping in src/agents/service/manage-agents/manage-agents.service.spec.ts
- [X] T033 [P] [US2] Write repository tests for listByAuthor excluding other users' agents in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts
- [X] T034 [P] [US2] Write e2e tests for multi-user owned-only listing and empty listing in test/agents.e2e-spec.ts
- [X] T035 [US2] Run US2 tests with npm test and npm run test:e2e and verify they fail for missing list behavior in src/agents/ and test/agents.e2e-spec.ts

### Implementation for User Story 2

- [X] T036 [US2] Implement list business behavior and summary mapping in src/agents/service/manage-agents/manage-agents.service.ts
- [X] T037 [US2] Implement Prisma author-scoped list query in src/agents/repository/agent-store/prisma-agent-store.repository.ts
- [X] T038 [US2] Implement GET /agents response mapping in src/agents/controller/agents.controller.ts
- [X] T039 [US2] Run US2 tests with npm test and npm run test:e2e and confirm list behavior passes in src/agents/ and test/agents.e2e-spec.ts

**Checkpoint**: Create and list work independently while preserving author scoping.

---

## Phase 6: User Story 3 - Delete Own Agent (Priority: P3)

**Goal**: An authenticated user deletes an owned agent and receives the same not-found outcome for missing or non-owned agents.

**Independent Test**: Create an agent for one user, delete it as that user, and verify it disappears from the user's list; attempt delete for a missing or other-user agent and verify 404 without exposing ownership.

### Tests for User Story 3 (REQUIRED)

- [X] T040 [P] [US3] Write controller tests for 204 owned delete and 404 missing or non-owned delete in src/agents/controller/agents.controller.spec.ts
- [X] T041 [P] [US3] Write service tests for owner-scoped delete success and not-found outcomes in src/agents/service/manage-agents/manage-agents.service.spec.ts
- [X] T042 [P] [US3] Write repository tests for deleteByIdAndAuthor deleting only matching id and author in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts
- [X] T043 [P] [US3] Write e2e tests for delete success, subsequent list absence, missing-agent 404, and non-owned-agent 404 in test/agents.e2e-spec.ts
- [X] T044 [US3] Run US3 tests with npm test and npm run test:e2e and verify they fail for missing delete behavior in src/agents/ and test/agents.e2e-spec.ts

### Implementation for User Story 3

- [X] T045 [US3] Implement owner-scoped delete business behavior and not-found handling in src/agents/service/manage-agents/manage-agents.service.ts
- [X] T046 [US3] Implement Prisma deleteByIdAndAuthor query and not-found result mapping in src/agents/repository/agent-store/prisma-agent-store.repository.ts
- [X] T047 [US3] Implement DELETE /agents/:id 204 and 404 response behavior in src/agents/controller/agents.controller.ts
- [X] T048 [US3] Run US3 tests with npm test and npm run test:e2e and confirm delete behavior passes in src/agents/ and test/agents.e2e-spec.ts

**Checkpoint**: Create, list, delete, ownership scoping, and non-disclosing not-found behavior all work.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, documentation, and quality gates across all stories.

- [X] T049 [P] Add Prisma generation and migration instructions for the Agent model in specs/001-agent-management/quickstart.md
- [X] T050 [P] Verify OpenAPI contract still matches implemented /agents responses in specs/001-agent-management/contracts/agents.openapi.yaml
- [X] T051 Run npm run lint and fix any explicit typing, doc comment, no-any, or style violations in src/auth/, src/prisma/, src/agents/, and test/agents.e2e-spec.ts
- [X] T052 Run npm test and fix any unit test failures in src/auth/, src/prisma/, and src/agents/
- [X] T053 Run npm run test:e2e and fix any e2e failures in test/agents.e2e-spec.ts
- [X] T054 Run npm run test:cov and verify at least 80% coverage for new or modified auth, prisma, and agent management behavior in coverage/
- [X] T055 Execute quickstart validation scenarios against a local app using AUTH_SECRET=test-secret in specs/001-agent-management/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **US4 Authentication Rejection (Phase 3)**: Depends on Foundational; should complete before create/list/delete implementation because every route must be protected.
- **US1 Create Own Agent (Phase 4)**: Depends on US4 route protection; MVP scope.
- **US2 List Own Agents (Phase 5)**: Depends on US4 and can reuse repository/service boundaries from US1.
- **US3 Delete Own Agent (Phase 6)**: Depends on US4 and benefits from US1/US2 test data helpers.
- **Polish (Phase 7)**: Depends on all selected user stories.

### User Story Dependencies

- **US4 (P1)**: Starts after Foundational; protects all agent management actions.
- **US1 (P1)**: Starts after US4; delivers the MVP create flow.
- **US2 (P2)**: Starts after US4; can be implemented after or alongside US1 once shared repository helpers exist.
- **US3 (P3)**: Starts after US4; should follow US1 for straightforward owned-agent setup.

### Within Each User Story

- Write tests first.
- Run the new tests and verify they fail for the expected missing behavior.
- Implement domain models, services, repositories, and controllers in dependency order.
- Run the story-specific tests again and confirm they pass.
- Stop at each checkpoint to validate the story independently.

### Parallel Opportunities

- Setup tasks T003, T004, and T005 can run in parallel after T001 and T002 are understood.
- Foundational model/interface tasks T007 and T008 can run in parallel.
- Test-writing tasks inside each story that touch different files can run in parallel.
- Repository and service implementations for US2 and US3 can proceed in parallel after US4 when coordinated to avoid same-file edits.
- Polish contract and quickstart verification tasks T049 and T050 can run in parallel.

---

## Parallel Example: User Story 4

```bash
Task: "T012 [P] [US4] Write verify-token service tests in src/auth/service/verify-auth-token/verify-auth-token.service.spec.ts"
Task: "T013 [P] [US4] Write controller authorization tests in src/agents/controller/agents.controller.spec.ts"
Task: "T014 [P] [US4] Write e2e authentication rejection tests in test/agents.e2e-spec.ts"
```

## Parallel Example: User Story 1

```bash
Task: "T021 [P] [US1] Write controller tests for valid create and invalid name payloads in src/agents/controller/agents.controller.spec.ts"
Task: "T022 [P] [US1] Write service tests for create behavior in src/agents/service/manage-agents/manage-agents.service.spec.ts"
Task: "T023 [P] [US1] Write repository create tests in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts"
Task: "T024 [P] [US1] Write e2e create tests in test/agents.e2e-spec.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T031 [P] [US2] Write controller list tests in src/agents/controller/agents.controller.spec.ts"
Task: "T032 [P] [US2] Write service list tests in src/agents/service/manage-agents/manage-agents.service.spec.ts"
Task: "T033 [P] [US2] Write repository list tests in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts"
Task: "T034 [P] [US2] Write e2e list tests in test/agents.e2e-spec.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T040 [P] [US3] Write controller delete tests in src/agents/controller/agents.controller.spec.ts"
Task: "T041 [P] [US3] Write service delete tests in src/agents/service/manage-agents/manage-agents.service.spec.ts"
Task: "T042 [P] [US3] Write repository delete tests in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts"
Task: "T043 [P] [US3] Write e2e delete tests in test/agents.e2e-spec.ts"
```

---

## Implementation Strategy

### MVP First (US4 + US1)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: US4 authentication rejection for all management routes.
4. Complete Phase 4: US1 create own agent.
5. Validate with npm test, npm run test:e2e, and the create scenarios in quickstart.md.

### Incremental Delivery

1. Deliver US4 + US1 as the MVP protected create flow.
2. Add US2 to confirm created agents through owner-scoped listing.
3. Add US3 for owner-scoped deletion and non-disclosing not-found behavior.
4. Finish polish tasks and run lint, unit, e2e, coverage, and quickstart validation.

### Parallel Team Strategy

1. Complete Setup and Foundational phases together.
2. Implement US4 first to establish protected route behavior.
3. Split US1, US2, and US3 tests across controller, service, repository, and e2e files with coordination for same-file edits.
4. Integrate story phases in priority order and run quality gates after each checkpoint.

## Notes

- [P] tasks are parallelizable because they touch different files or independent test layers.
- [US1], [US2], [US3], and [US4] labels map directly to spec.md user stories.
- Every implementation task includes exact target paths and follows the controller -> service -> repository boundary from plan.md.
- Avoid accepting author email from request payloads; ownership must come only from the verified token.
