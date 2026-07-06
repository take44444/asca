---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for every feature and bug fix. Test tasks MUST precede the
corresponding implementation tasks and MUST include verification that each new test fails for
the expected reason before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **NestJS backend**: `src/<module>/controller/`, `src/<module>/service/`, and
  `src/<module>/repository/`
- Tests are colocated with the controller, service, or repository they verify.
- Paths shown below are examples; replace every placeholder with the paths from `plan.md`.

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize or update the TypeScript/NestJS project dependencies
- [ ] T003 [P] Configure linting, formatting, and changed-code coverage tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Write contract test for [endpoint] in src/[module]/controller/[module].controller.spec.ts
- [ ] T011 [P] [US1] Write service test for [behavior] in src/[module]/service/[service]/[service].service.spec.ts
- [ ] T012 [US1] Run the new tests and verify they fail for the expected missing behavior

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create domain model in src/[module]/service/[service]/[service].model.ts
- [ ] T014 [P] [US1] Define repository abstraction in src/[module]/repository/[repository]/[repository].repository.interface.ts
- [ ] T015 [US1] Implement service in src/[module]/service/[service]/[service].service.ts
- [ ] T016 [US1] Implement repository in src/[module]/repository/[repository]/
- [ ] T017 [US1] Implement DTO and controller in src/[module]/controller/
- [ ] T018 [US1] Add validation, authorization, error handling, and public API doc comments

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T019 [P] [US2] Write controller test in src/[module]/controller/[module].controller.spec.ts
- [ ] T020 [P] [US2] Write service test in src/[module]/service/[service]/[service].service.spec.ts
- [ ] T021 [US2] Run the new tests and verify they fail for the expected missing behavior

### Implementation for User Story 2

- [ ] T022 [P] [US2] Define domain model and interfaces under src/[module]/
- [ ] T023 [US2] Implement service and repository under src/[module]/
- [ ] T024 [US2] Implement DTO and controller under src/[module]/controller/
- [ ] T025 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T026 [P] [US3] Write controller test in src/[module]/controller/[module].controller.spec.ts
- [ ] T027 [P] [US3] Write service test in src/[module]/service/[service]/[service].service.spec.ts
- [ ] T028 [US3] Run the new tests and verify they fail for the expected missing behavior

### Implementation for User Story 3

- [ ] T029 [P] [US3] Define domain model and interfaces under src/[module]/
- [ ] T030 [US3] Implement service and repository under src/[module]/
- [ ] T031 [US3] Implement DTO and controller under src/[module]/controller/

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Add any cross-cutting unit and integration tests
- [ ] TXXX Security hardening
- [ ] TXXX Run lint and the complete test suite
- [ ] TXXX Verify at least 80% coverage for new and modified behavior
- [ ] TXXX Verify explicit typing, no `any`, and doc comments for public APIs
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and observed failing for the expected reason before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Write independent tests for User Story 1 together:
Task: "Controller test for [endpoint] in src/[module]/controller/[module].controller.spec.ts"
Task: "Service test for [behavior] in src/[module]/service/[service]/[service].service.spec.ts"

# Define independent abstractions for User Story 1 together:
Task: "Create [Entity] domain model in src/[module]/service/[service]/[service].model.ts"
Task: "Create repository interface in src/[module]/repository/[repository]/[repository].repository.interface.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
