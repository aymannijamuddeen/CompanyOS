# CompanyOS Intelligence Layer

The CompanyOS intelligence layer is the provider-neutral orchestration boundary between the UI/API and company data/agents.

## Request flow

1. `POST /api/intelligence/ask` receives an arbitrary company question.
2. Company context is loaded from PostgreSQL: company, departments, agents, tasks, documents, and customer count.
3. The intent router classifies the request as company, tasks, knowledge, sales, marketing, finance, HR, operations, or general.
4. Relevant company documents are retrieved with the knowledge search service.
5. The router chooses direct structured answering, knowledge retrieval, or specialist delegation.
6. An `AgentExecution` is created and `ToolCall` records capture context/knowledge retrieval.
7. If an OpenAI-compatible provider is configured, the provider receives the bounded company context and evidence. Otherwise a deterministic fallback answers from available data without inventing facts.
8. The execution is completed/failed and an `Activity` record is written.
9. The question and answer are persisted as conversation messages.

## LLM configuration

The layer does not hard-code a model vendor. Configure an OpenAI-compatible endpoint in `backend/.env`:

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

If these are not configured, CompanyOS remains usable for deterministic structured/context answers.

## API

- `POST /api/intelligence/ask` — arbitrary company question
- `GET /api/intelligence/executions` — recent intelligence/agent execution trace

## Important boundary

The intelligence layer is deliberately separated from the model provider. Retrieval, company context, routing, execution tracing, conversations, and specialist-agent selection remain CompanyOS responsibilities; the model provider is replaceable.
