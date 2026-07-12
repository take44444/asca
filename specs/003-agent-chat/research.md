# Research: Agent Chat

## Decision: Implement chat as a new service capability inside the existing agents module

**Rationale**: Chat is an action on a user-owned agent, and the existing module already owns authentication entry points, agent ownership rules, and agent persistence. A dedicated `chat-agent` service keeps chat orchestration separate from create/list/get/update/delete behavior while preserving module cohesion.

**Alternatives considered**: Adding chat to the existing manage-agents service was rejected because response generation and streaming would make the service too broad. Creating a separate top-level chat module was rejected because chat authorization and role lookup are inseparable from the agent domain in this feature.

## Decision: Reuse owner-aware lookup semantics from agent customization

**Rationale**: The spec requires distinct not-found and forbidden outcomes. The current repository can find an agent by id, and the service can then compare `author` to the authenticated user's email before response generation begins. This avoids starting provider work for unauthorized requests.

**Alternatives considered**: Owner-scoped lookup returning 404 for both missing and cross-owner agents was rejected because the spec requires 403 for cross-owner chat. Performing owner checks in the controller was rejected because ownership is a business rule.

## Decision: Add AI SDK `ai` and `@ai-sdk/openai` behind a response-generation abstraction

**Rationale**: The feature explicitly requires the AI SDK for real-time streaming. The current project does not include AI SDK packages, so `ai` and `@ai-sdk/openai` must be added. The AI SDK `streamText` function is intended for chat bots and real-time text applications, and the OpenAI provider is supplied by `@ai-sdk/openai` with `OPENAI_API_KEY` as the default API key source. Keeping this dependency behind `GenerateAgentResponseService` makes controller and domain tests deterministic.

**Alternatives considered**: Calling OpenAI directly was rejected because it violates the requested AI SDK integration. Letting the controller call `streamText` directly was rejected because provider concerns would leak into presentation code and make authorization and tests harder to isolate.

## Decision: Use `ASCA_MODEL` and OpenAI provider configuration for real generation

**Rationale**: The input requirements define `OPENAI_API_KEY` and `ASCA_MODEL`. The response generator should fail clearly when required configuration is missing and should use the configured model name so environments can switch models without code changes.

**Alternatives considered**: Hardcoding a model was rejected because the requirements provide a model environment variable. Falling back to a default model was rejected because it can hide configuration mistakes and make tests or environments non-reproducible.

## Decision: Store base A.S.C.A. instruction in `instructions.md`

**Rationale**: The base instruction is expected to grow. Keeping it as a separate managed file lets tests verify content loading without embedding long instruction text in service code, and it keeps public behavior stable while instruction wording evolves.

**Alternatives considered**: Hardcoding the instruction in TypeScript was rejected by the input requirements. Storing it in the database was rejected because this feature has one static base instruction and no administrative editing requirement.

## Decision: Use system messages for instruction-level chat guidance

**Rationale**: The installed AI SDK `ModelMessage` contract supports `system`, `user`, `assistant`, and `tool` roles, but not a `developer` role. The public chat contract therefore accepts `system` messages for caller-supplied instruction guidance, and agent role instructions are injected only when no system message is already present.

**Alternatives considered**: Accepting `developer` and translating it to `system` at the generator boundary was rejected because it exposes a role the provider contract does not support. Treating instruction guidance as ordinary user text was rejected because it would not satisfy the role-injection rule.

## Decision: Return AI SDK UI message streams for v1

**Rationale**: The frontend consumes the endpoint with `useChat` from `@ai-sdk/react`, so the backend should return the AI SDK UI message stream protocol instead of raw text chunks. The controller uses the AI SDK response helper so headers and serialization stay aligned with the installed AI SDK version.

**Alternatives considered**: A raw plain-text stream was rejected because it would require frontend adapter code around `useChat`. A hand-rolled Server-Sent Events serializer was rejected because `pipeUIMessageStreamToResponse` already defines the protocol expected by AI SDK clients.

## Decision: Do not persist chat history or generated responses

**Rationale**: The specification explicitly excludes chat history storage. Accepted requests should perform authorization, generate a response stream, and finish without creating conversation records.

**Alternatives considered**: Persisting user and assistant messages was rejected because it expands scope into retention, privacy, and conversation retrieval. Persisting only provider response identifiers was rejected because no resume or history workflow is requested.
