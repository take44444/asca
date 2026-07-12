# Agent chat

This feature implements agent chat functionality, allowing users to chat with the agents they create.

## Requirements

- All requests to the agent chat endpoints SHALL require authentication via a valid JWT token.
  - The JWT token SHALL be provided in the `Authorization` header of the request.
  - The system SHALL validate the JWT token and return a 401 Unauthorized response for requests with invalid or missing tokens.
  - The system SHALL use the `AUTH_SECRET` environment variable to verify the JWT tokens.
  - The decoding of the JWT token SHALL extract the user name (`name`) and email (`email`), which SHALL be used to associate the agent with the authenticated user.

- The system SHALL provide an API endpoint to send a message to an existing agent and receive a response.
  - The method for this endpoint SHALL be `POST`. The path for this endpoint SHALL be `/agents/{id}/chat`.
  - The system SHALL allow users to chat with agents whose `author` field matches the authenticated user's email.
    - IF the authenticated user is not the author of the agent being chatted with, the system SHALL return a 403 Forbidden response.
  - The API SHALL be implemented using `ai` library to stream the response from the agent in real-time.
    - IF the `input` field in the request payload is empty or missing, the system SHALL return a 400 Bad Request response.
    - The system SHALL inject a basic instruction below to the request to OpenAI API as `instructions` parameter. The instruction will be long in the future, so you should create a separate file (`instructions.md`) for it and read it from the file instead of hardcoding it in the code.
      ```
      You are A.S.C.A., an autonomous agent that can perform tasks on behalf of the user.
      ```
    - IF the agent has a ROLE.md, and the `input` messages don't contain any `developer` messages, the system SHALL inject the ROLE.md content to the request to OpenAI API as first `developer` message in the `input` messages.

## Environment Variables

- `AUTH_SECRET`: A secret key used to verify JWT tokens and authenticate requests.
- `DATABASE_URL`: A database connection string used to connect to the database. The system SHALL use SQLite for development and testing purposes.
- `OPENAI_API_KEY`: The API key for accessing the OpenAI API.
  - The value is already set in the `.env.local` file, so you can use it for testing if needed.
- `ASCA_MODEL`: The model name for the OpenAI API.
  - The value is already set in the `.env.local` file, so you can use it for testing if needed.

## Out of Scope

- Integration with the production database (PostgreSQL) is out of scope for this feature. The system SHALL use SQLite for development and testing purposes.
- Storing the chat history in the database is out of scope for this feature. This will be implemented in a future feature.
