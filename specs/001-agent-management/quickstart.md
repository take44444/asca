# Quickstart: Agent Management Validation

## Prerequisites

- Node.js environment compatible with the existing NestJS project.
- Dependencies installed with `npm install`.
- `AUTH_SECRET` set for JWT verification.
- SQLite database URL configured for development and tests.

## Setup

1. Install the feature dependencies when tasks call for implementation:

   ```bash
   npm install class-validator class-transformer @auth/core @prisma/client prisma
   ```

2. Prepare the Prisma SQLite test/development database after the schema is added:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

3. Run the application:

   ```bash
   AUTH_SECRET=test-secret npm run start:dev
   ```

## Contract Validation Scenarios

Use [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml) as the source of request and response expectations.

### Scenario 1: Reject unauthenticated create

Request:

```bash
curl -i -X POST http://localhost:3000/agents \
  -H 'Content-Type: application/json' \
  -d '{"name":"Support Agent"}'
```

Expected outcome:

- HTTP `401`
- No agent is created

### Scenario 2: Create an agent

Request with a valid bearer JWT containing `name` and `email` claims:

```bash
curl -i -X POST http://localhost:3000/agents \
  -H 'Authorization: Bearer <valid-jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Support Agent"}'
```

Expected outcome:

- HTTP `201`
- Response includes `id`, `name`, and `author`
- `author` equals the authenticated token email

### Scenario 3: Reject invalid create payload

Request:

```bash
curl -i -X POST http://localhost:3000/agents \
  -H 'Authorization: Bearer <valid-jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"   "}'
```

Expected outcome:

- HTTP `400`
- No agent is created

### Scenario 4: List only owned agents

Request:

```bash
curl -i http://localhost:3000/agents \
  -H 'Authorization: Bearer <valid-jwt-for-user-a>'
```

Expected outcome:

- HTTP `200`
- Response is an array of objects with `id` and `name`
- No agents owned by other authenticated emails appear

### Scenario 5: Delete only an owned agent

Request:

```bash
curl -i -X DELETE http://localhost:3000/agents/<agent-id> \
  -H 'Authorization: Bearer <valid-jwt-for-owner>'
```

Expected outcome:

- HTTP `204`
- Subsequent owner list response no longer includes the deleted agent

### Scenario 6: Hide non-owned or missing agents on delete

Request:

```bash
curl -i -X DELETE http://localhost:3000/agents/<missing-or-other-user-agent-id> \
  -H 'Authorization: Bearer <valid-jwt>'
```

Expected outcome:

- HTTP `404`
- No other user's data is disclosed

## Test and Quality Gates

Run these before considering implementation complete:

```bash
npm run lint
npm test
npm run test:e2e
npm run test:cov
```

Expected outcomes:

- All tests pass.
- New or modified agent management behavior has at least 80% coverage.
- Tests demonstrate create, list, delete, authentication rejection, validation rejection, and ownership scoping.
