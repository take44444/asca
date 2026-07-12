# Agent

This feature implements agent customization functionality to the agent management system, allowing users to customize the ROLE.md or other attributes of the agents they create.

## Requirements

- All requests to the agent management endpoints SHALL require authentication via a valid JWT token. (Already implemented)
  - The JWT token SHALL be provided in the `Authorization` header of the request.
  - The system SHALL validate the JWT token and return a 401 Unauthorized response for requests with invalid or missing tokens.
  - The system SHALL use the `AUTH_SECRET` environment variable to verify the JWT tokens.
  - The decoding of the JWT token SHALL extract the user name (`name`) and email (`email`), which SHALL be used to associate the agent with the authenticated user.

- The system SHALL provide an API endpoint to patch the name and the ROLE.md of an existing agent.
  - The method for this endpoint SHALL be `PATCH`. The path for this endpoint SHALL be `/agents/{id}`.
  - The system SHALL allow users to update agents whose `author` field matches the authenticated user's email.
  - The payload for this endpoint SHALL include the following fields:
    - `name`: The new name of the agent (string, optional).
    - `role`: The new ROLE.md content of the agent (string, optional).
  - The system SHALL return a 200 OK response with a JSON payload containing the updated agent object, including its unique identifier (`id`), name (`name`), author (`author`), and role (`role`).
  - The system SHALL return a 400 Bad Request response IF the JSON payload is invalid or no fields are provided for update.
  - The system SHALL return a 404 Not Found response IF the agent with the specified `id` does not exist.
  - The system SHALL return a 403 Forbidden response IF the authenticated user is not the author of the agent being updated.
  - In the current implementation, only the `id`, `name`, and `author` fields are stored in the database. So add the `role` field to the database schema to store the ROLE.md content of the agent in this feature. The `role` field SHALL be a string and can be empty or null if not provided.

- The system SHALL provide an API endpoint to retrieve a agent by its unique identifier (`id`).
  - The path for this endpoint SHALL be `/agents/{id}`.
  - The system SHALL return a 200 OK response with a JSON payload containing the agent object, including its unique identifier (`id`), name (`name`), author (`author`), and role (`role`).
  - The system SHALL return a 404 Not Found response IF the agent with the specified `id` does not exist.
  - The system SHALL return a 403 Forbidden response IF the authenticated user is not the author of the agent being retrieved.

- In an API endpoint to retrieve a list of all agents, the system SHALL not include the `role` field in the response payload for each agent object. The response SHALL only include the `id` and `name`. So you don't need to change the existing endpoint for listing agents.

## Environment Variables

- `AUTH_SECRET`: A secret key used to verify JWT tokens and authenticate requests.
- `DATABASE_URL`: A database connection string used to connect to the database. The system SHALL use SQLite for development and testing purposes.

## Out of Scope

- Integration with the production database (PostgreSQL) is out of scope for this feature. The system SHALL use SQLite for development and testing purposes.
