# Tasks: Agent Chat

**Input**: Design documents from `/specs/003-agent-chat/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agents.openapi.yaml, quickstart.md

**Tests**: Tests are REQUIRED by the project constitution. Test tasks MUST precede the corresponding implementation tasks and MUST include verification that each new test fails for the expected reason before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- NestJS backend source lives under `src/agents/`.
- Controller DTOs and HTTP behavior live under `src/agents/controller/`.
- Domain service capabilities live under `src/agents/service/<capability>/`.
- Agent persistence remains under `src/agents/repository/agent-store/`.
- End-to-end tests live in `test/agents.e2e-spec.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add required dependencies and create the shared service directories used by all chat stories.

- [X] T001 Install AI SDK dependencies `ai` and `@ai-sdk/openai` with `npm install ai @ai-sdk/openai` updating package.json and package-lock.json
- [X] T002 Create chat service directories at src/agents/service/chat-agent/ and src/agents/service/generate-agent-response/
- [X] T003 Add base A.S.C.A. instruction text to src/agents/service/generate-agent-response/instructions.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared domain contracts, module wiring, and response-generation boundaries that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Define ChatMessage, ChatRequest, and ChatResponseStream domain types in src/agents/service/chat-agent/agent-chat.model.ts
- [X] T005 [P] Define CHAT_AGENT_SERVICE and ChatAgentService interface in src/agents/service/chat-agent/chat-agent.service.interface.ts
- [X] T006 [P] Define GENERATE_AGENT_RESPONSE_SERVICE and GenerateAgentResponseService interface in src/agents/service/generate-agent-response/generate-agent-response.service.interface.ts
- [X] T007 Register ChatAgentDomainService and GenerateOpenAiAgentResponseService providers and interface tokens in src/agents/agents.module.ts
- [X] T008 Add AgentChatRequestDto, AgentChatMessageDto, and chat response typing in src/agents/controller/agent.dto.ts
- [X] T009 Update the OpenAPI contract notes for generated task traceability in specs/003-agent-chat/contracts/agents.openapi.yaml

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order or in parallel if staffed.

---

## Phase 3: User Story 1 - Chat With My Agent (Priority: P1) - MVP

**Goal**: An authenticated user can send valid chat input to an owned agent and receive a streamed AI SDK UI message response that uses base instructions and role guidance when appropriate.

**Independent Test**: Authenticate as an agent author, send a valid `POST /agents/{id}/chat` request to an existing owned agent, and confirm a streamed UI message response is returned.

### Tests for User Story 1 (REQUIRED)

> Write these tests FIRST and verify they FAIL for the expected missing behavior before implementation.

- [X] T010 [P] [US1] Add controller tests for successful single-message and message-list chat delegation in src/agents/controller/agents.controller.spec.ts
- [X] T011 [P] [US1] Add chat service tests for owned-agent lookup, role forwarding, and generation start in src/agents/service/chat-agent/chat-agent.service.spec.ts
- [X] T012 [P] [US1] Add response-generator tests for loading instructions.md, using ASCA_MODEL, and streaming text in src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts
- [X] T013 [P] [US1] Add e2e test for authenticated owner chat returning a streamed AI SDK UI message response in test/agents.e2e-spec.ts
- [X] T014 [US1] Run US1 tests and verify they fail for missing chat endpoint/service behavior using src/agents/controller/agents.controller.spec.ts, src/agents/service/chat-agent/chat-agent.service.spec.ts, src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts, and test/agents.e2e-spec.ts

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement ChatAgentDomainService owned-agent orchestration in src/agents/service/chat-agent/chat-agent.service.ts
- [X] T016 [P] [US1] Implement GenerateOpenAiAgentResponseService instruction loading, ASCA_MODEL validation, OpenAI model creation, and text stream generation in src/agents/service/generate-agent-response/generate-agent-response.service.ts
- [X] T017 [US1] Implement chat request DTO validation and mapping helpers in src/agents/controller/agent.dto.ts
- [X] T018 [US1] Add authenticated POST /agents/:id/chat controller action that delegates to ChatAgentService in src/agents/controller/agents.controller.ts
- [X] T019 [US1] Integrate streamed UI message output with NestJS HTTP response handling in src/agents/controller/agents.controller.ts
- [X] T020 [US1] Run US1 unit and e2e tests until passing for src/agents/controller/agents.controller.spec.ts, src/agents/service/chat-agent/chat-agent.service.spec.ts, src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts, and test/agents.e2e-spec.ts

**Checkpoint**: User Story 1 is fully functional and independently testable as the MVP.

---

## Phase 4: User Story 2 - Reject Invalid Chat Requests (Priority: P2)

**Goal**: Authenticated owners receive clear client-error outcomes for missing, empty, whitespace-only, or malformed chat input before response generation begins.

**Independent Test**: Authenticate as an agent author, submit invalid chat payloads to an owned agent, and confirm each returns a client error without invoking response generation.

### Tests for User Story 2 (REQUIRED)

> Write these tests FIRST and verify they FAIL for the expected missing validation behavior before implementation.

- [X] T021 [P] [US2] Add controller tests for missing input, empty string input, whitespace input, invalid message role, and empty message list in src/agents/controller/agents.controller.spec.ts
- [X] T022 [P] [US2] Add chat service tests proving invalid chat requests do not call GenerateAgentResponseService in src/agents/service/chat-agent/chat-agent.service.spec.ts
- [X] T023 [P] [US2] Add e2e tests for 400 responses on invalid chat payloads in test/agents.e2e-spec.ts
- [X] T024 [US2] Run US2 tests and verify they fail for missing validation behavior using src/agents/controller/agents.controller.spec.ts, src/agents/service/chat-agent/chat-agent.service.spec.ts, and test/agents.e2e-spec.ts

### Implementation for User Story 2

- [X] T025 [US2] Implement strict chat input validation and normalization in src/agents/controller/agent.dto.ts
- [X] T026 [US2] Add defensive invalid-request checks to ChatAgentDomainService before generation in src/agents/service/chat-agent/chat-agent.service.ts
- [X] T027 [US2] Ensure BadRequestException outcomes preserve existing agent data and skip response generation in src/agents/controller/agents.controller.ts
- [X] T028 [US2] Run US2 unit and e2e tests until passing for src/agents/controller/agents.controller.spec.ts, src/agents/service/chat-agent/chat-agent.service.spec.ts, and test/agents.e2e-spec.ts

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Protect Agent Chat Access (Priority: P3)

**Goal**: Missing authentication, invalid authentication, unknown agents, and cross-owner chat attempts are rejected before any agent role content is exposed or response generation begins.

**Independent Test**: Submit chat requests without a token, with an invalid token, for an unknown agent, and as a different authenticated user, then confirm `401`, `404`, or `403` outcomes and no generation.

### Tests for User Story 3 (REQUIRED)

> Write these tests FIRST and verify they FAIL for the expected missing protection behavior before implementation.

- [X] T029 [P] [US3] Add controller tests for unauthenticated chat rejection before ChatAgentService calls in src/agents/controller/agents.controller.spec.ts
- [X] T030 [P] [US3] Add chat service tests for not-found and cross-owner forbidden outcomes before GenerateAgentResponseService calls in src/agents/service/chat-agent/chat-agent.service.spec.ts
- [X] T031 [P] [US3] Add response-generator tests for preserving existing developer messages and injecting role only when absent in src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts
- [X] T032 [P] [US3] Add e2e tests for 401 missing token, 401 invalid token, 403 cross-owner chat, 404 unknown agent, and unchanged persisted agent data in test/agents.e2e-spec.ts
- [X] T033 [US3] Run US3 tests and verify they fail for missing access-protection or developer-message behavior using src/agents/controller/agents.controller.spec.ts, src/agents/service/chat-agent/chat-agent.service.spec.ts, src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts, and test/agents.e2e-spec.ts

### Implementation for User Story 3

- [X] T034 [US3] Enforce NotFoundException and ForbiddenException ownership checks before generation in src/agents/service/chat-agent/chat-agent.service.ts
- [X] T035 [US3] Ensure POST /agents/:id/chat authenticates before DTO mapping and service calls in src/agents/controller/agents.controller.ts
- [X] T036 [US3] Implement developer-message preservation and role-injection rules in src/agents/service/generate-agent-response/generate-agent-response.service.ts
- [X] T037 [US3] Map response-provider configuration and stream failures to clear operational errors in src/agents/service/generate-agent-response/generate-agent-response.service.ts
- [X] T038 [US3] Run US3 unit and e2e tests until passing for src/agents/controller/agents.controller.spec.ts, src/agents/service/chat-agent/chat-agent.service.spec.ts, src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts, and test/agents.e2e-spec.ts

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation consistency, and quality gates across all stories.

- [X] T039 [P] Update quickstart validation notes with final streaming command behavior in specs/003-agent-chat/quickstart.md
- [X] T040 [P] Verify public doc comments and explicit types for new chat classes, interfaces, functions, constants, and parameters in src/agents/service/chat-agent/ and src/agents/service/generate-agent-response/
- [X] T041 Run npm run lint and fix lint findings in src/agents/controller/, src/agents/service/chat-agent/, src/agents/service/generate-agent-response/, and test/agents.e2e-spec.ts
- [X] T042 Run npm test and fix unit test regressions in src/agents/
- [X] T043 Run npm run test:e2e and fix end-to-end regressions in test/agents.e2e-spec.ts
- [X] T044 Run npm run test:cov and verify at least 80% coverage for new or modified chat behavior in src/agents/
- [X] T045 Execute the manual streaming check from specs/003-agent-chat/quickstart.md against POST /agents/{id}/chat

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion - MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and integrates with chat DTO/service paths from US1.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and can be tested independently with mocked generation.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 - Chat With My Agent**: Start after Phase 2. Delivers the MVP endpoint and streaming path.
- **US2 - Reject Invalid Chat Requests**: Start after Phase 2; easiest after US1 DTO/controller scaffolding exists.
- **US3 - Protect Agent Chat Access**: Start after Phase 2; easiest after US1 chat service scaffolding exists.

### Within Each User Story

- Tests MUST be written and observed failing for the expected reason before implementation.
- Domain models and interfaces before services.
- Services before controller endpoint behavior.
- Controller endpoint behavior before e2e validation.
- Story complete before moving to the next priority unless working in parallel with separate files.

### Parallel Opportunities

- T004, T005, and T006 can run in parallel after setup because they create different interface/model files.
- T010, T011, T012, and T013 can run in parallel because they target different test files or independent suites.
- T015 and T016 can run in parallel after interfaces exist because orchestration and generation implementations are separate files.
- T021, T022, and T023 can run in parallel for US2 test coverage.
- T029, T030, T031, and T032 can run in parallel for US3 test coverage.
- T039 and T040 can run in parallel during polish.

---

## Parallel Example: User Story 1

```bash
# Write independent tests for User Story 1 together:
Task: "T010 [US1] Add controller tests in src/agents/controller/agents.controller.spec.ts"
Task: "T011 [US1] Add chat service tests in src/agents/service/chat-agent/chat-agent.service.spec.ts"
Task: "T012 [US1] Add response-generator tests in src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts"
Task: "T013 [US1] Add e2e streaming test in test/agents.e2e-spec.ts"

# Implement independent service layers together after interfaces exist:
Task: "T015 [US1] Implement chat orchestration in src/agents/service/chat-agent/chat-agent.service.ts"
Task: "T016 [US1] Implement response generation in src/agents/service/generate-agent-response/generate-agent-response.service.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [US2] Add invalid payload controller tests in src/agents/controller/agents.controller.spec.ts"
Task: "T022 [US2] Add invalid request service tests in src/agents/service/chat-agent/chat-agent.service.spec.ts"
Task: "T023 [US2] Add invalid payload e2e tests in test/agents.e2e-spec.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T029 [US3] Add unauthenticated controller tests in src/agents/controller/agents.controller.spec.ts"
Task: "T030 [US3] Add not-found and forbidden service tests in src/agents/service/chat-agent/chat-agent.service.spec.ts"
Task: "T031 [US3] Add developer-message response-generator tests in src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts"
Task: "T032 [US3] Add auth and owner e2e tests in test/agents.e2e-spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate streamed owner chat independently.
5. Demo `POST /agents/{id}/chat` with an owned agent and valid input.

### Incremental Delivery

1. Complete Setup + Foundational.
2. Add US1 for valid owner chat streaming.
3. Add US2 for invalid request handling.
4. Add US3 for authentication, authorization, not-found, and developer-message protection.
5. Run polish verification across lint, unit, e2e, coverage, and manual streaming check.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. One developer writes controller/e2e tests while another writes service/generator tests.
3. One developer implements `chat-agent` orchestration while another implements `generate-agent-response`.
4. Integrate in `AgentsController` and `AgentsModule`, then run full verification.

## Notes

- [P] tasks use different files or independent suites and can run in parallel when their prerequisites are complete.
- [US1], [US2], and [US3] labels map directly to user stories in specs/003-agent-chat/spec.md.
- Every implementation task has a preceding failing-test task.
- Do not add chat history persistence; it is explicitly out of scope.
- Keep DTOs out of services, DAOs out of services, and AI SDK provider types out of domain service contracts.
