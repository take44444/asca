# Data Model: Agent Chat

## Agent

Represents a configurable agent owned by one authenticated user.

### Fields

- `id`: Unique immutable agent identifier.
- `name`: User-visible agent name.
- `author`: Authenticated owner email address.
- `role`: Optional user-authored role instructions used to guide chat behavior.

### Relationships

- Belongs to one authenticated user by matching `author` to the authenticated user's email.
- Supplies role instructions to `Chat Session` only after authentication and owner authorization succeed.

### Validation Rules

- `id` must identify exactly one agent for chat to proceed.
- `author` must match the authenticated user's email before response generation begins.
- `role` may be empty or absent; absent role content means no agent-specific system guidance is injected.

### State Transitions

- Chat does not change stored agent state.
- Unauthorized, forbidden, invalid, not-found, and provider-failure outcomes leave the agent unchanged.

## Authenticated User

Represents the requester authenticated from the bearer token.

### Fields

- `name`: Authenticated user display name.
- `email`: Authenticated user email address used for ownership checks.

### Relationships

- Owns zero or more agents where `Agent.author` equals `email`.
- May start chat only with owned agents.

### Validation Rules

- Must be present before any agent data or role instructions are used.
- Email is the sole ownership value used by this feature.

## Chat Request

Represents the submitted request to converse with an agent.

### Fields

- `agentId`: Unique identifier of the target agent.
- `input`: Non-empty chat input, either a single user message or an ordered list of conversation messages.

### Relationships

- Targets one `Agent`.
- Is submitted by one `Authenticated User`.
- Produces one `Chat Response Stream` when accepted.

### Validation Rules

- `input` is required.
- A single-message `input` must be a non-empty string after trimming.
- A message-list `input` must include at least one message with non-empty text content.
- Accepted message roles are `user`, `assistant`, and `system`.
- A message-list is considered to contain system guidance when at least one message has role `system`.

### State Transitions

- `Submitted` -> `Rejected` when authentication, authorization, target lookup, or input validation fails.
- `Submitted` -> `Streaming` after authentication, authorization, validation, and response generation start.
- `Streaming` -> `Completed` when the response stream ends.
- `Streaming` -> `Failed` when the response provider or stream fails.

## Chat Message

Represents one item in a submitted conversation.

### Fields

- `role`: Message role: `user`, `assistant`, or `system`.
- `content`: Message text.

### Relationships

- Belongs to one `Chat Request`.
- System-role messages suppress automatic role injection.

### Validation Rules

- `role` must be one of the accepted roles.
- `content` must be a string.
- User message content must contain non-whitespace text.
- Assistant and system message content must be text when provided.

## Instruction Content

Represents guidance used during response generation.

### Fields

- `baseInstruction`: Static A.S.C.A. instruction loaded from managed instruction content.
- `agentRoleInstruction`: Optional role instructions from the authorized agent.

### Relationships

- Base instruction applies to every accepted chat request.
- Agent role instruction applies only when the authorized agent has role content and the submitted conversation has no system message.

### Validation Rules

- Base instruction must be present and non-empty for real response generation.
- Agent role instruction is optional.

## Chat Response Stream

Represents generated agent output delivered progressively to the caller.

### Fields

- `contentType`: Stream media type returned by the endpoint.
- `chunks`: Ordered generated text chunks.
- `completionState`: `completed` or `failed`.

### Relationships

- Produced by one accepted `Chat Request`.
- Uses one configured response-generation provider and model.

### Validation Rules

- Must not begin until authentication, authorization, and input validation have succeeded.
- Must not create or update stored chat history.
