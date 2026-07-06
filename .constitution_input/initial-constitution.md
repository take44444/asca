# A.S.C.A. backend Constitution

A.S.C.A. - A Slightly Clever Agent - is an autonomous job assistant designed to assist users in various tasks.

This project is a backend implementation of the A.S.C.A. agent. The backend is responsible for providing the core harness and logic for the agent's functionality.

The frontend of A.S.C.A. is developed in another repository. The frontend provides a user-friendly interface for users to interact with the A.S.C.A. agent.

## Core Principles

### 1. Clean Architecture

- Strict separation of concerns between presentation, business logic, and data access layers.
  - Business logic layer (service layer) **MUST NOT** directly depend on the presentation implementations or data access implementations; it **MUST** depend on abstractions (interfaces).
  - Presentation layer (controller layer) **MUST NOT** contain business logic; it **MUST** delegate to the service layer.
  - Data access layer (repository layer) **MUST NOT** contain business logic; it **MUST** delegate to the service layer. It **MUST** be responsible for all interactions with the database and external data sources, and **MUST** expose an interface that abstracts away implementation details.

- DTOs and DAOs **MUST NOT** be used in the service layer. The service layer **MUST** use domain models to represent the business entities and their behavior.

### 2. Test-Driven Development (TDD)

- Red-Green-Refactor cycle **MUST** be followed for all development.
- All new features and bug fixes **MUST** have corresponding tests that cover the functionality being implemented or fixed.
- Tests **MUST** be written before the implementation based on the requirements and expected behavior of the feature or bug fix.

### 3. Quality Gates

- All code **MUST** pass linting checks and adhere to the project's coding standards.
- All code **MUST** have a code coverage of at least 80% for new features and bug fixes.
- All tests **MUST** pass.

## Technical Stack

- TypeScript
- NestJS for web application framework
- class-validator for validation
- Prisma for repository and database access
- PostgreSQL for production database
- SQLite for development and testing database
- Auth.js for authorization
- @nestjs/testing for testing

## Project and Code Guidelines

- Must follow Google TypeScript Style Guide
- Types must be explicitly defined for all classes, interfaces, constants, variables, function parameters, and return types.
- Type "any" **MUST NOT** be used. All types must be explicitly defined to ensure type safety and maintainability.
- Docstrings **MUST** be provided for all public classes, interfaces, and functions.

### Directory Structure

- Each module **MUST** have its own directory under the `src` directory, containing its own controller, service, and repository subdirectories.
- The directory structure **MUST** follow this pattern:

```
src/
├── main.ts                                                 NestJS application entry point
├── app.module.ts                                           Root module of the application
├── <module_name1>/                                         Module directory for <module_name1>
│   ├── controller/                                         Controller subdirectory for <module_name1>
│   │   ├── <module_name1>.dto.ts                           Data Transfer Object (DTO) definitions for <module_name1>
│   │   ├── <module_name1>.controller.ts                    Controller implementation for <module_name1>
│   │   ├── <module_name1>.controller.spec.ts               Controller unit tests for <module_name1>
│   ├── service/                                            Service subdirectory for <module_name1>
│   │   ├── <service_name1>/
│   │   │   ├── <service_name1>.service.interface.ts        Service interface definition for <service_name1>
│   │   │   ├── <service_name1>.model.ts                    Model definition for <service_name1>
│   │   │   ├── <service_name1>.service.ts                  Service implementation for <service_name1>
│   │   │   └── <service_name1>.service.spec.ts             Service unit tests for <service_name1>
│   │   ├── <service_name2>/                                Service subdirectory for <service_name2>
│   │       ...
│   └── repository/                                         Repository subdirectory for <module_name1>
│       ├── <repository_name1>/                             Repository subdirectory for <repository_name1>
│       │   ├── <repository_name1>.repository.interface.ts  Repository interface definition for <repository_name1>
│       │   ├── <repository_name1>.dao.ts                   Data Access Object (DAO) implementation for <repository_name1>
│       │   ├── <repository_name1>.dev.repository.ts        Development repository implementation for <repository_name1>
│       │   ├── <repository_name1>.prod.repository.ts       Production repository implementation for <repository_name1>
│       │   └── <repository_name1>.repository.spec.ts       Repository unit tests for <repository_name1>
│       ├── <repository_name2>/                             Repository subdirectory for <repository_name2>
│       ...
├── <module_name2>/                                         Module directory for <module_name2>
│   ...
```

## Governance

Constitution supersedes all other practices

### Governance Rules

- This constitution supersedes all other practices and preferences in the project. Any deviations from the principles and guidelines outlined in this constitution **MUST** be documented, justified, and approved by the project maintainers.
- Any amendments to this constitution **MUST** include a reason for the change, a clear description of the amendment, date, and a migration plan if necessary.
