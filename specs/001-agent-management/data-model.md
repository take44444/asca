# Data Model: Agent Management

## Entity: Agent

Represents a manageable agent owned by one authenticated user.

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | Yes | Unique agent identifier assigned when the agent is created. | Must be unique and immutable after creation. |
| `name` | string | Yes | User-provided agent name. | Must be present and contain at least one non-whitespace character. |
| `author` | string | Yes | Email address of the authenticated user who owns the agent. | Must come from the validated token email, not request payload. |

### Relationships

- `Agent.author` is associated with `AuthenticatedUser.email`.
- Agents are not shared between users in this feature.

### State Transitions

```text
Not Created -> Created -> Deleted
```

- `Created`: Agent has an identifier, name, and author email and is returned by owner-scoped list requests.
- `Deleted`: Agent no longer appears in owner-scoped list requests and cannot be deleted again by the owner.

## Entity: Authenticated User

Represents the verified identity extracted from a valid bearer JWT.

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | string | Yes | Display name from the validated token. | Must be extracted from a verified token. |
| `email` | string | Yes | Email from the validated token. | Must be extracted from a verified token and used as the owner key. |

### Relationships

- One authenticated user can own zero or more agents.
- This feature does not create, update, or persist user profile records.

## Repository Operations

| Operation | Input | Output | Rules |
|-----------|-------|--------|-------|
| Create agent | Agent name, authenticated user email | Created agent | Assign unique id; persist name and author email. |
| List agents | Authenticated user email | Agent summaries | Return only agents matching author email; empty list is valid. |
| Delete agent | Agent id, authenticated user email | Deleted/not-found outcome | Delete only when both id and author email match. |

## Validation Rules

- Authentication must succeed before any repository operation runs.
- Agent names must be rejected when missing, empty, or whitespace-only.
- Author email must never be accepted from the create payload.
- List responses expose `id` and `name`; create responses expose `id`, `name`, and `author`.
- Delete of a missing or non-owned agent returns the same not-found outcome.
