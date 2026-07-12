# Quickstart: Agent Customization

## Prerequisites

- Install dependencies with `npm install`.
- Set `DATABASE_URL` for the local SQLite database.
- Set `AUTH_SECRET` to the secret used to sign test bearer tokens.
- Review the HTTP contract in [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml).

## Expected Implementation Scope

- `GET /agents/{id}` returns id, name, author, and role for the authenticated author.
- `PATCH /agents/{id}` updates name, role, or both for the authenticated author.
- Cross-owner `GET` and `PATCH` requests return forbidden.
- Unknown ids return not found for both `GET /agents/{id}` and `PATCH /agents/{id}`.
- Invalid or empty update payloads return bad request.
- `GET /agents` continues returning only id and name for each agent.

## Test-First Validation Flow

1. Add failing controller tests in `src/agents/controller/agents.controller.spec.ts` for:
   - successful single-agent retrieval;
   - successful name-and-role update;
   - successful name-only and role-only updates;
   - invalid update payloads;
   - PATCH unknown-id not-found behavior;
   - forbidden cross-owner retrieval and update;
   - unchanged list response shape without role.
2. Add failing service tests in `src/agents/service/manage-agents/manage-agents.service.spec.ts` for:
   - owner-authorized retrieval and update;
   - retrieval and update not-found outcomes;
   - forbidden outcomes when the agent exists with another author;
   - partial update preservation of omitted fields.
3. Add failing repository tests in `src/agents/repository/agent-store/prisma-agent-store.repository.spec.ts` for:
   - role persistence;
   - lookup by id;
   - owner-aware update;
   - list ordering and summary compatibility after role is added.
4. Add failing e2e tests in `test/agents.e2e-spec.ts` for:
   - authenticated `GET /agents/{id}`;
   - authenticated `PATCH /agents/{id}`;
   - `400`, `401`, `403`, and `404` outcomes, including PATCH unknown-id `404`;
   - list response omission of role content.
5. Run each new failing test before implementation and confirm it fails for the missing behavior.

## Verification Commands

```bash
npm run lint
npm test
npm run test:e2e
npm run test:cov
```

## Expected Outcomes

- All new and existing tests pass.
- Changed agent customization behavior reaches at least 80% coverage.
- The API behavior matches [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml).
- Role content is visible only in single-agent detail and update responses, never in list responses.
- The 1-second retrieval/update latency target is treated as a post-implementation acceptance metric, not as a required automated verification gate for this feature.
