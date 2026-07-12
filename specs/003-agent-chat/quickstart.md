# Quickstart: Agent Chat

## Prerequisites

- Install dependencies with `npm install`.
- Add AI SDK dependencies during implementation with `npm install ai @ai-sdk/openai`.
- Set `DATABASE_URL` for the local SQLite database.
- Set `AUTH_SECRET` to the secret used to sign bearer tokens.
- Set `OPENAI_API_KEY` for real response generation.
- Set `ASCA_MODEL` to the OpenAI model used for chat.
- Review the HTTP contract in [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml).

## Expected Implementation Scope

- `POST /agents/{id}/chat` accepts authenticated owner-only chat requests.
- Successful chat returns a progressively streamed AI SDK UI message response for `@ai-sdk/react` `useChat`.
- Missing or invalid authentication returns unauthorized before agent lookup or response generation.
- Cross-owner chat returns forbidden before response generation.
- Unknown agent ids return not found.
- Missing, empty, or whitespace-only input returns bad request.
- The base A.S.C.A. instruction is loaded from `src/agents/service/generate-agent-response/instructions.md`.
- Agent role instructions are injected only when the submitted message list has no developer message.
- Chat history is not stored.

## Test-First Validation Flow

1. Add failing controller tests in `src/agents/controller/agents.controller.spec.ts` for:
   - unauthenticated chat rejection before service calls;
   - invalid chat payload rejection before service calls;
   - successful chat delegation for an owned agent;
   - propagated not-found, forbidden, and provider-failure outcomes.
2. Add failing chat service tests in `src/agents/service/chat-agent/chat-agent.service.spec.ts` for:
   - owned-agent chat starts response generation;
   - unknown agent id returns not found;
   - cross-owner agent returns forbidden;
   - role instructions are passed to generation for owned agents;
   - response generation is not called for invalid, not-found, or forbidden requests.
3. Add failing response-generator tests in `src/agents/service/generate-agent-response/generate-agent-response.service.spec.ts` for:
   - base instruction content is loaded from `instructions.md`;
   - configured model is required;
   - role instructions are injected when no developer message exists;
   - role instructions are not injected when a developer message already exists;
   - provider errors surface as clear operational failures.
4. Add failing e2e tests in `test/agents.e2e-spec.ts` for:
   - authenticated owner chat returns a streamed AI SDK UI message response;
   - missing and invalid tokens return `401`;
   - cross-owner chat returns `403`;
   - unknown agent chat returns `404`;
   - missing, empty, and whitespace-only input returns `400`;
   - chat requests leave persisted agent data unchanged.
5. Run each new failing test before implementation and confirm it fails for the missing behavior.

## Verification Commands

```bash
npm run lint
npm test
npm run test:e2e
npm run test:cov
```

## Manual Streaming Check

1. Start the service with valid `AUTH_SECRET`, `OPENAI_API_KEY`, `ASCA_MODEL`, and `DATABASE_URL`.
2. Create or reuse an agent owned by the bearer token email.
3. Send a chat request. A successful response returns HTTP `200` with
   `content-type: text/event-stream` and `x-vercel-ai-ui-message-stream: v1`,
   which is the AI SDK UI message stream format consumed by `useChat`:

```bash
curl -N \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/agents/<agent-id>/chat \
  -d '{"input":"Hello, what can you help me do?"}'
```

For a conversation payload, send `input` as an ordered message array:

```bash
curl -N \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/agents/<agent-id>/chat \
  -d '{"input":[{"role":"developer","content":"Keep answers concise."},{"role":"user","content":"Summarize this project."}]}'
```

## Expected Outcomes

- All new and existing tests pass.
- Changed agent chat behavior reaches at least 80% coverage.
- The API behavior matches [contracts/agents.openapi.yaml](./contracts/agents.openapi.yaml).
- Unauthorized and forbidden requests do not start response generation.
- Role content is used only for authorized chat generation and is not exposed through error responses.
- No chat history records are persisted.
- The 3-second stream-start target is treated as a post-implementation acceptance metric, not as a required automated verification gate for this feature.
