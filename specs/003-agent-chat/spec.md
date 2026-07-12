# Feature Specification: Agent Chat

**Feature Branch**: `003-agent-chat`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "Create spec based on the requirements in .specify_input/agent-chat.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chat With My Agent (Priority: P1)

As an authenticated user, I want to send a message to an agent I created and receive the agent's response as it is generated so that I can interact with my configured agent without waiting for the entire answer to finish.

**Why this priority**: Owner-only agent chat is the core value of the feature and must provide an immediate conversational experience.

**Independent Test**: Can be fully tested by authenticating as an agent author, sending a valid chat message to an existing owned agent, and confirming a streamed response is returned.

**Acceptance Scenarios**:

1. **Given** an authenticated user owns an existing agent, **When** the user sends a non-empty chat message to that agent, **Then** the system returns an agent response as a stream.
2. **Given** an authenticated user owns an existing agent, **When** the user sends multiple conversation messages, **Then** the system uses the provided conversation as the basis for the streamed response.
3. **Given** an authenticated user owns an existing agent with role instructions and the submitted conversation has no system guidance, **When** the user sends a chat message, **Then** the system includes the agent's role instructions before producing the response.

---

### User Story 2 - Reject Invalid Chat Requests (Priority: P2)

As an authenticated user, I want invalid chat requests to be rejected clearly so that I can correct the request without creating partial or misleading conversations.

**Why this priority**: Chat requests must have useful user input before any response generation begins.

**Independent Test**: Can be fully tested by authenticating as an agent author, submitting an empty or missing chat input, and confirming the system rejects the request before generating a response.

**Acceptance Scenarios**:

1. **Given** an authenticated user owns an existing agent, **When** the user sends a chat request with a missing input field, **Then** the system rejects the request with a client-error outcome.
2. **Given** an authenticated user owns an existing agent, **When** the user sends a chat request with empty input, **Then** the system rejects the request with a client-error outcome.

---

### User Story 3 - Protect Agent Chat Access (Priority: P3)

As an agent author, I want only my account to chat with my agents so that private agent role instructions and behavior cannot be used by other users.

**Why this priority**: Chat access can expose private role instructions and agent behavior, so authorization must be enforced before any response is generated.

**Independent Test**: Can be fully tested by attempting chat requests with missing authentication, invalid authentication, and a different authenticated user, then confirming each request is rejected before response generation.

**Acceptance Scenarios**:

1. **Given** no valid authentication is provided, **When** a chat request is submitted, **Then** the system rejects the request before looking up or using the agent.
2. **Given** an authenticated user does not own an existing agent, **When** the user sends a chat message to that agent, **Then** the system denies access and does not generate a response.
3. **Given** an authenticated user requests an agent that does not exist, **When** the user sends a chat message, **Then** the system reports that the agent was not found.

### Edge Cases

- Requests without authentication or with invalid authentication are rejected before any agent data, role instructions, or generated response is returned.
- Requests for agents owned by another user are rejected and no response generation is started.
- Requests for unknown agent identifiers report that the agent was not found.
- Chat requests with missing, empty, or whitespace-only user input are rejected before response generation.
- If an agent has role instructions and the submitted conversation already contains system guidance, the system preserves the submitted system guidance and does not inject duplicate role instructions.
- If an agent has no role instructions, the system proceeds with the base agent instruction only.
- If the response provider cannot produce a response, the user receives a clear failure outcome without storing chat history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require valid authentication for every agent chat request.
- **FR-002**: System MUST identify the authenticated user's name and email from the authentication token.
- **FR-003**: System MUST use the authenticated user's email as the ownership value for authorizing agent chat access.
- **FR-004**: Users MUST be able to send a chat message to an existing agent when the authenticated user's email matches the agent author.
- **FR-005**: Agent chat MUST be exposed as a `POST /agents/{id}/chat` public contract.
- **FR-006**: Successful agent chat requests MUST return the agent response as it is generated rather than only after the full response is complete.
- **FR-007**: Chat requests MUST include an `input` value containing the user message or conversation messages to process.
- **FR-008**: Chat requests MUST reject missing, empty, or whitespace-only `input` values with a client-error outcome.
- **FR-009**: Chat requests MUST deny access when the requested agent exists but is owned by another author.
- **FR-010**: Chat requests MUST report not found when no agent exists for the requested identifier.
- **FR-011**: Chat response generation MUST include the base A.S.C.A. instruction: "You are A.S.C.A., an autonomous agent that can perform tasks on behalf of the user."
- **FR-012**: The base A.S.C.A. instruction MUST be maintained as separately managed instruction content so it can grow without changing the public chat behavior.
- **FR-013**: If an owned agent has role instructions and the submitted conversation contains no system guidance, chat response generation MUST include the agent role instructions as the first system message in the conversation.
- **FR-014**: If the submitted conversation already contains system guidance, chat response generation MUST NOT inject the agent role instructions as an additional system message.
- **FR-015**: Agent chat MUST NOT store chat history as part of this feature.
- **FR-016**: Agent chat MUST use the configured response-generation provider and configured model for response generation.
- **FR-017**: Missing or unusable response-generation configuration MUST produce a clear operational failure outcome without bypassing authentication or authorization.

### Architecture and Quality Requirements *(mandatory)*

- **AQ-001**: The feature plan MUST define the controller, service/domain, repository, and response-generation responsibilities affected by authenticated agent chat, owner authorization, streaming responses, base instructions, and role instruction injection.
- **AQ-002**: The feature plan MUST define independently testable behavior for authentication rejection, owner authorization, not-found handling, invalid input, successful streamed chat, role instruction injection, system-guidance preservation, and response-provider failure so tests can be written and observed failing before implementation.
- **AQ-003**: The feature plan MUST identify validation, authentication, authorization, response-generation configuration, instruction content management, and public API documentation obligations introduced or changed by this feature.
- **AQ-004**: The feature plan MUST define measurable quality verification, including lint, passing tests, and at least 80% coverage for new or modified behavior.

### Key Entities *(include if feature involves data)*

- **Agent**: A user-owned configurable agent. Key attributes are unique identifier, author email, and optional role instructions used to guide chat behavior.
- **Authenticated User**: The requester proven by authentication. Key attributes are user name and email; email determines agent ownership.
- **Chat Request**: A request to converse with an agent. Key attributes are target agent identifier and non-empty input containing the user message or conversation messages.
- **Chat Response Stream**: The generated agent response delivered progressively to the user. Key attributes are ordered response content and completion or failure state.
- **Instruction Content**: Managed guidance used during response generation. Key attributes are the base A.S.C.A. instruction and optional agent role instructions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid owner chat requests for existing agents begin returning generated response content as a stream.
- **SC-002**: 100% of missing-token, invalid-token, and cross-owner chat attempts are rejected before response generation begins.
- **SC-003**: 100% of chat requests with missing, empty, or whitespace-only input are rejected with a clear client-error outcome.
- **SC-004**: 100% of chat requests for agents with role instructions and no submitted system guidance include those role instructions before generating a response.
- **SC-005**: 100% of chat requests that already include system guidance preserve the submitted system guidance without adding duplicate agent role instructions.
- **SC-006**: 95% of accepted chat requests begin streaming visible response content within 3 seconds in the standard development and test environment, excluding response-provider outages.

## Assumptions

- Existing agent ownership rules use the agent author email and remain authoritative for chat access.
- Existing authentication tokens provide user name and email claims.
- Existing agent role instructions are available from prior agent customization work.
- The configured response-generation provider and model are available in the target environment for manual or integration validation.
- Chat history persistence is intentionally deferred and no conversation records are written by this feature.
- Production database integration remains outside the scope of this feature; development and automated testing use the existing non-production persistence setup.
