# Research: Agent Customization

## Decision: Store role instructions directly on Agent

**Rationale**: The feature requires role content to remain available after retrieval and update workflows, and role content belongs to the same ownership and lifecycle as the agent record. A nullable text-like field keeps existing agents valid and supports agents without role customization.

**Alternatives considered**: A separate role/customization entity was rejected because the current feature has a one-to-one lifecycle and no independent role history, sharing, or versioning requirements. In-memory or file-backed role storage was rejected because the existing agent data is already persisted through Prisma.

## Decision: Add owner-aware single-agent retrieval and update service methods

**Rationale**: The controller should remain limited to HTTP/authentication/DTO mapping, while the service owns business outcomes such as not found, forbidden access, partial update validation, and unchanged data preservation. Repository methods should expose persistence operations without deciding request-level behavior.

**Alternatives considered**: Implementing owner checks only in the controller was rejected because it would leak business rules into presentation code. Returning database rows directly from the repository to the controller was rejected because DAOs must not cross into the service boundary.

## Decision: Distinguish forbidden and not-found outcomes for retrieve/update

**Rationale**: The specification requires 404 when the id does not exist and 403 when the agent exists but is owned by another author. The service therefore needs enough repository support to determine existence separately from owner authorization for `GET /agents/{id}` and `PATCH /agents/{id}`.

**Alternatives considered**: A single owner-scoped lookup returning 404 for both cases was rejected because it does not satisfy the specified 403 behavior for cross-owner access. Applying the current delete behavior to retrieve/update was rejected because delete has a different existing contract.

## Decision: Keep list responses as AgentSummary without role

**Rationale**: The specification explicitly keeps list responses lightweight and prevents role content from being exposed in bulk. The service can continue mapping full stored agents to `AgentSummary`, and the controller response DTO should continue to include only id and name for list operations.

**Alternatives considered**: Returning role on list for convenience was rejected because it expands disclosure and violates the feature boundary. Adding a list option to include roles was rejected because the spec does not request filtering or expanded views.

## Decision: Validate update payload as partial name/role with at least one field

**Rationale**: The API must support name-only and role-only updates while rejecting no-op requests. Name should retain the existing non-empty trimmed behavior. Role may be empty or absent, so an explicitly empty role string is a valid request to clear role instructions.

**Alternatives considered**: Requiring both fields was rejected because the specification allows each field to be optional. Rejecting empty role content was rejected because the specification allows empty or absent role instructions.

## Decision: Extend the existing OpenAPI contract for the agents resource

**Rationale**: This project already records the HTTP interface as OpenAPI. Extending the contract in this feature keeps request/response expectations testable and consistent with the first agent management plan.

**Alternatives considered**: Documenting behavior only in prose was rejected because the project already has a machine-readable public contract. Creating a separate contract format was rejected because this is still a backend HTTP service.
