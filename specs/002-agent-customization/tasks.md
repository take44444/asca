# Tasks: Agent Customization

**Input**: Design documents from `/specs/002-agent-customization/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agents.openapi.yaml, quickstart.md

**Tests**: Tests are REQUIRED for this feature. Test tasks MUST precede corresponding implementation tasks and MUST include verification that each new test fails for the expected reason before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **NestJS backend**: `src/agents/controller/`, `src/agents/service/`, and `src/agents/repository/`
- Tests are colocated with the controller, service, or repository they verify.
- End-to-end tests live in `test/agents.e2e-spec.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the current NestJS/Prisma test environment and contract artifacts are ready for test-first implementation.

- [X] T001 Review existing agent module boundaries in `src/agents/agents.module.ts`
- [X] T002 Review current Prisma Agent schema and SQLite test setup in `prisma/schema.prisma`
- [X] T003 [P] Review API contract expectations for GET and PATCH agent operations in `specs/002-agent-customization/contracts/agents.openapi.yaml`
- [X] T004 [P] Review TDD validation scenarios and verification commands in `specs/002-agent-customization/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared contracts and conventions that all stories use before any story implementation begins.

**CRITICAL**: No user story implementation can begin until this phase is complete.

- [X] T005 Identify existing authentication request-user mapping used by agents controller tests in `src/agents/controller/agents.controller.spec.ts`
- [X] T006 Identify existing service error handling patterns for not-found and forbidden outcomes in `src/agents/service/manage-agents/manage-agents.service.ts`
- [X] T007 Identify existing repository test database lifecycle and Prisma client setup in `src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts`
- [X] T008 Identify existing e2e JWT setup and auth fixtures in `test/agents.e2e-spec.ts`

**Checkpoint**: Foundation ready - user story tests and implementation can now begin.

---

## Phase 3: User Story 1 - Update My Agent Customization (Priority: P1) MVP

**Goal**: Authenticated owners can update name, role, or both for an owned agent and receive id, name, author, and role.

**Independent Test**: Authenticate as an agent author, update an owned agent with name-and-role, name-only, and role-only payloads, and confirm returned values preserve omitted fields correctly.

### Tests for User Story 1 (REQUIRED)

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T009 [P] [US1] Add controller tests for PATCH name-and-role, name-only, role-only, invalid payload, and unknown-id not-found outcomes in `src/agents/controller/agents.controller.spec.ts`
- [X] T010 [P] [US1] Add service tests for owner-authorized partial updates, omitted-field preservation, and missing-id not-found update behavior in `src/agents/service/manage-agents/manage-agents.service.spec.ts`
- [X] T011 [P] [US1] Add repository tests for role persistence and owner-aware update by id and author in `src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts`
- [X] T012 [P] [US1] Add e2e tests for authenticated PATCH success, 400 invalid payload, and 404 unknown-id outcomes in `test/agents.e2e-spec.ts`
- [X] T013 [US1] Run the new US1 tests and verify they fail for missing update behavior in `src/agents/service/manage-agents/manage-agents.service.spec.ts`

### Implementation for User Story 1

- [X] T014 [US1] Add nullable/default role persistence to the Agent model in `prisma/schema.prisma`
- [X] T015 [US1] Regenerate Prisma client and align generated artifacts for the updated Agent schema in `prisma/schema.prisma`
- [X] T016 [US1] Add role to AgentDao and ensure absent role maps to an empty string contract value in `src/agents/repository/agent-store/agent.dao.ts`
- [X] T017 [US1] Add role to Agent and define an UpdateAgent input domain type in `src/agents/service/manage-agents/agent.model.ts`
- [X] T018 [US1] Add an owner-aware update method to the repository interface in `src/agents/repository/agent-store/agent-store.repository.interface.ts`
- [X] T019 [US1] Implement owner-aware update persistence with name/role partial data in `src/agents/repository/agent-store/prisma-agent-store.repository.ts`
- [X] T020 [US1] Add update capability to the service interface in `src/agents/service/manage-agents/manage-agents.service.interface.ts`
- [X] T021 [US1] Implement update validation, missing-id not-found mapping, owner update orchestration, and domain mapping in `src/agents/service/manage-agents/manage-agents.service.ts`
- [X] T022 [US1] Add UpdateAgentDto and AgentDetailDto with class-validator/class-transformer rules in `src/agents/controller/agent.dto.ts`
- [X] T023 [US1] Add authenticated PATCH `/agents/:id` endpoint and response mapping in `src/agents/controller/agents.controller.ts`
- [X] T024 [US1] Run US1 unit and e2e tests and verify they pass in `test/agents.e2e-spec.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Retrieve My Agent Details (Priority: P2)

**Goal**: Authenticated owners can retrieve one owned agent by id and receive id, name, author, and role; unknown ids return not found.

**Independent Test**: Authenticate as an agent author, request an owned agent by id, and confirm the detail response includes role; request an unknown id and confirm not found.

### Tests for User Story 2 (REQUIRED)

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T025 [P] [US2] Add controller tests for GET `/agents/:id` success and not-found mapping in `src/agents/controller/agents.controller.spec.ts`
- [X] T026 [P] [US2] Add service tests for owner-authorized retrieval and missing-id not-found behavior in `src/agents/service/manage-agents/manage-agents.service.spec.ts`
- [X] T027 [P] [US2] Add repository tests for lookup by id returning role data in `src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts`
- [X] T028 [P] [US2] Add e2e tests for authenticated GET `/agents/:id` success and 404 outcomes in `test/agents.e2e-spec.ts`
- [X] T029 [US2] Run the new US2 tests and verify they fail for missing retrieval behavior in `src/agents/controller/agents.controller.spec.ts`

### Implementation for User Story 2

- [X] T030 [US2] Add lookup-by-id method to the repository interface in `src/agents/repository/agent-store/agent-store.repository.interface.ts`
- [X] T031 [US2] Implement lookup-by-id persistence and role mapping in `src/agents/repository/agent-store/prisma-agent-store.repository.ts`
- [X] T032 [US2] Add get capability to the service interface in `src/agents/service/manage-agents/manage-agents.service.interface.ts`
- [X] T033 [US2] Implement get-by-id service behavior with not-found mapping and domain conversion in `src/agents/service/manage-agents/manage-agents.service.ts`
- [X] T034 [US2] Add authenticated GET `/agents/:id` endpoint and AgentDetailDto mapping in `src/agents/controller/agents.controller.ts`
- [X] T035 [US2] Run US2 unit and e2e tests and verify they pass in `test/agents.e2e-spec.ts`

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Protect Agent Ownership (Priority: P3)

**Goal**: Authenticated non-owners cannot retrieve or update another author's agent, and unauthenticated requests are rejected before agent data is exposed or changed.

**Independent Test**: Authenticate as a different user and confirm GET and PATCH for another author's agent return forbidden without role content or persisted changes; omit authentication and confirm unauthorized.

### Tests for User Story 3 (REQUIRED)

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T036 [P] [US3] Add controller tests for forbidden cross-owner GET and PATCH outcomes in `src/agents/controller/agents.controller.spec.ts`
- [X] T037 [P] [US3] Add service tests for cross-owner forbidden retrieval and update without data mutation in `src/agents/service/manage-agents/manage-agents.service.spec.ts`
- [X] T038 [P] [US3] Add e2e tests for 401 unauthenticated and 403 cross-owner GET/PATCH outcomes in `test/agents.e2e-spec.ts`
- [X] T039 [US3] Run the new US3 tests and verify they fail for missing ownership protection behavior in `src/agents/service/manage-agents/manage-agents.service.spec.ts`

### Implementation for User Story 3

- [X] T040 [US3] Implement forbidden owner checks for retrieval and update in `src/agents/service/manage-agents/manage-agents.service.ts`
- [X] T041 [US3] Ensure controller maps forbidden service outcomes without returning agent details in `src/agents/controller/agents.controller.ts`
- [X] T042 [US3] Verify repository update leaves cross-owner records unchanged in `src/agents/repository/agent-store/prisma-agent-store.repository.ts`
- [X] T043 [US3] Run US3 unit and e2e tests and verify they pass in `test/agents.e2e-spec.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation for list response compatibility, API contract alignment, coverage, and style.

- [X] T044 [P] Add controller regression test confirming list responses omit role in `src/agents/controller/agents.controller.spec.ts`
- [X] T045 [P] Add repository regression test confirming list ordering and summary compatibility after role persistence in `src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts`
- [X] T046 [P] Add e2e regression test confirming GET `/agents` omits role content in `test/agents.e2e-spec.ts`
- [X] T047 Update OpenAPI contract examples or schema notes if implementation response details changed in `specs/002-agent-customization/contracts/agents.openapi.yaml`
- [X] T048 Run lint and resolve any explicit typing, public doc comment, or no-any issues in `src/agents/controller/agents.controller.ts`
- [X] T049 Run all unit tests and resolve regressions in `src/agents/service/manage-agents/manage-agents.service.spec.ts`
- [X] T050 Run all e2e tests and resolve regressions in `test/agents.e2e-spec.ts`
- [X] T051 Run coverage verification and confirm at least 80% coverage for changed agent customization behavior in `specs/002-agent-customization/quickstart.md`
- [X] T052 Review architecture boundaries to ensure DTOs and DAOs do not cross into the service layer in `src/agents/service/manage-agents/manage-agents.service.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion and delivers the MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational completion; can be implemented after or alongside US1 if shared role persistence is available.
- **User Story 3 (Phase 5)**: Depends on retrieval/update service shapes from US1 and US2.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependency on US2 or US3.
- **User Story 2 (P2)**: Can start after Foundational - reuses AgentDetailDto and role persistence from US1 when implemented sequentially.
- **User Story 3 (P3)**: Requires get/update service paths from US1 and US2 to enforce ownership protection across both operations.

### Within Each User Story

- Tests MUST be written and observed failing for the expected reason before implementation.
- Domain models and interfaces before service implementation.
- Repository interface before repository implementation.
- Service behavior before controller endpoints.
- Story-specific e2e checks after unit-level behavior is implemented.

### Parallel Opportunities

- T003 and T004 can run in parallel during setup.
- T009, T010, T011, and T012 can be written in parallel because they modify different test files.
- T025, T026, T027, and T028 can be written in parallel because they modify different test files.
- T036, T037, and T038 can be written in parallel because they modify different test files.
- T044, T045, and T046 can be written in parallel because they modify different test files.

---

## Parallel Example: User Story 1

```bash
# Write independent US1 tests together:
Task: "T009 controller PATCH tests in src/agents/controller/agents.controller.spec.ts"
Task: "T010 service update tests in src/agents/service/manage-agents/manage-agents.service.spec.ts"
Task: "T011 repository role/update tests in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts"
Task: "T012 e2e PATCH tests in test/agents.e2e-spec.ts"
```

## Parallel Example: User Story 2

```bash
# Write independent US2 tests together:
Task: "T025 controller GET detail tests in src/agents/controller/agents.controller.spec.ts"
Task: "T026 service retrieval tests in src/agents/service/manage-agents/manage-agents.service.spec.ts"
Task: "T027 repository lookup tests in src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts"
Task: "T028 e2e GET detail tests in test/agents.e2e-spec.ts"
```

## Parallel Example: User Story 3

```bash
# Write independent US3 protection tests together:
Task: "T036 controller forbidden tests in src/agents/controller/agents.controller.spec.ts"
Task: "T037 service forbidden tests in src/agents/service/manage-agents/manage-agents.service.spec.ts"
Task: "T038 e2e unauthorized/forbidden tests in test/agents.e2e-spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational checks.
3. Complete Phase 3: User Story 1 update customization.
4. Stop and validate US1 independently with controller, service, repository, and e2e tests.

### Incremental Delivery

1. Complete Setup + Foundational.
2. Add US1 update customization and validate name/role partial updates.
3. Add US2 detail retrieval and validate role visibility only for single-agent detail.
4. Add US3 ownership protection and validate 401/403 behavior.
5. Complete Polish checks for list compatibility, lint, full tests, coverage, and architecture boundaries.

### Parallel Team Strategy

1. One engineer writes controller and e2e tests while another writes service and repository tests.
2. After failing tests are confirmed, split implementation by boundary: repository, service/domain, controller/DTO.
3. Rejoin at e2e validation and coverage review before marking a story complete.
