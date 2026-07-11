# Research: Agent Management

## Decision: Use a dedicated `agents` domain module

**Rationale**: The feature has its own user-facing resource, ownership rules, persistence, and public HTTP contract. A dedicated module under `src/agents/` aligns with the project constitution and keeps controller, service/domain, and repository responsibilities easy to test independently.

**Alternatives considered**: Extending the starter `AppController`/`AppService` was rejected because it would mix unrelated app health/demo behavior with domain behavior. A shared generic CRUD module was rejected because the ownership and authentication rules are specific to agents.

## Decision: Verify bearer JWTs before controller actions reach agent behavior

**Rationale**: The spec requires all agent management actions to reject missing or invalid tokens before reading or changing agent data. A reusable auth service plus controller guard/decorator keeps token verification testable and allows controllers to receive an authenticated domain identity without parsing tokens themselves.

**Alternatives considered**: Verifying tokens inside each service method was rejected because it mixes transport authentication with domain behavior. Accepting a user email from request payloads was rejected because ownership must come from the validated token.

## Decision: Use authenticated email as the owner key

**Rationale**: The spec defines the token email as the value used to associate agents with a user. The service will pass authenticated email to repository methods for create, list, and delete operations.

**Alternatives considered**: Using the token name was rejected because names are not stable identifiers. Adding a separate user table was rejected because user lifecycle management is outside this feature.

## Decision: Implement persistence through Prisma with SQLite for development and tests

**Rationale**: The constitution mandates Prisma and SQLite for development and automated tests, while the feature explicitly excludes production PostgreSQL integration. A Prisma repository implementation allows tests to exercise real persistence without exposing DAOs to the service layer.

**Alternatives considered**: In-memory storage was rejected because the spec requires persisted agents and repository behavior should be testable against the same access pattern used by the application. Direct database access from services was rejected by the constitution.

## Decision: Model deletion as owner-scoped delete by identifier

**Rationale**: The spec requires users to delete only their own agents and to receive a not-found outcome when an agent does not exist or does not belong to them. Repository deletion should filter by both identifier and author email, so cross-user existence is never disclosed.

**Alternatives considered**: Returning forbidden for another user's agent was rejected because it reveals that the agent exists. Deleting by name was rejected because identifiers are the stable unique key returned by create and list.

## Decision: Use `class-validator` DTO validation for create payloads

**Rationale**: The constitution mandates `class-validator`, and the spec requires missing, empty, or whitespace-only names to be rejected. DTO validation handles the transport-level shape, while service tests still verify business behavior for accepted values.

**Alternatives considered**: Manual validation in controllers was rejected because it duplicates framework-supported validation. Service-only validation was rejected because invalid transport payloads should fail before domain behavior executes.

## Decision: Define OpenAPI-style HTTP contracts for `/agents`

**Rationale**: The feature exposes external HTTP behavior. An OpenAPI-style contract provides a clear source for endpoint paths, headers, payloads, responses, and error outcomes without prescribing controller implementation code.

**Alternatives considered**: Markdown-only endpoint notes were rejected because they are less precise for request/response schemas. Skipping contracts was rejected because this is a public web-service interface.
