# Data Model: Agent Customization

## Agent

Represents a configurable agent owned by one authenticated user.

### Fields

- `id`: Unique immutable agent identifier.
- `name`: User-visible agent name.
- `author`: Authenticated owner email address.
- `role`: User-authored role instructions for the agent. May be empty or absent when no role instructions have been provided.

### Relationships

- Belongs to one authenticated user by matching `author` to the authenticated user's email.
- Appears in list responses as an `AgentSummary` without role content.

### Validation Rules

- `id` must identify exactly one agent when present.
- `name` must be a non-empty string after trimming.
- `author` must match the authenticated user's email for single-agent retrieval and update.
- `role` must be text when provided; an empty string is valid.
- Update requests must include at least one of `name` or `role`.

### State Transitions

- Created agent starts with a name, author, and no role instructions unless a future creation flow supplies role content.
- Name-only update changes `name` and preserves `role`.
- Role-only update changes `role` and preserves `name`.
- Name-and-role update changes both fields together.
- Forbidden or invalid update attempts leave all stored fields unchanged.

## Authenticated User

Represents the requester authenticated from the bearer token.

### Fields

- `name`: Authenticated user display name.
- `email`: Authenticated user email address used for ownership checks.

### Relationships

- Owns zero or more agents where `Agent.author` equals `email`.

### Validation Rules

- Must be present before any single-agent data is retrieved or changed.
- Email is the sole ownership value used by this feature.

## Agent Summary

Represents an agent in collection/list responses.

### Fields

- `id`: Unique immutable agent identifier.
- `name`: User-visible agent name.

### Relationships

- Derived from an `Agent` owned by the authenticated user.

### Validation Rules

- Must not include `author` or `role` in list responses.
