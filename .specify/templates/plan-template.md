# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Clean Architecture**: Identify controller, service/domain, and repository boundaries;
  confirm services depend only on abstractions and use neither DTOs nor DAOs.
- **Test-Driven Development**: Define how each behavior will be tested first and how the
  initial failure will be verified before implementation.
- **Quality Gates**: Identify lint, test, and changed-code coverage commands; the plan MUST
  preserve the 80% minimum coverage requirement.
- **Technical Constraints**: Confirm the approved TypeScript/NestJS, validation, persistence,
  `@nestjs/jwt` authentication, testing, explicit-typing, no-`any`, and public-doc-comment
  requirements.
- **Project Structure**: Map each feature component to the required module-local controller,
  service, and repository directories.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── main.ts
├── app.module.ts
└── [module-name]/
    ├── controller/
    │   ├── [module-name].dto.ts
    │   ├── [module-name].controller.ts
    │   └── [module-name].controller.spec.ts
    ├── service/[service-name]/
    │   ├── [service-name].service.interface.ts
    │   ├── [service-name].model.ts
    │   ├── [service-name].service.ts
    │   └── [service-name].service.spec.ts
    └── repository/[repository-name]/
        ├── [repository-name].repository.interface.ts
        ├── [repository-name].dao.ts
        ├── [repository-name].dev.repository.ts
        ├── [repository-name].prod.repository.ts
        └── [repository-name].repository.spec.ts
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
