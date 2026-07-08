# fallcompass-api

HTTP wrapper for the [fallcompass](https://github.com/sjgant80-hub/fallcompass-sdk) sovereign LLM cascade. Language-agnostic — curl, Python, Go, anything that speaks HTTP.

- **7 endpoints** · `/health`, `/providers`, `/probe`, `/chat`, `/call/:provider`, `/keys/:provider` (POST/DELETE)
- **8 adapters** · ollama, fallcore, anthropic, openrouter, gemini, openai, mistral, webllm
- Express · Docker · optional bearer-token auth
- MIT

## Quick start

### npm

```bash
npm i -g @ai-native-solutions/fallcompass-api
FALLCOMPASS_ANTHROPIC_KEY=sk-ant-... fallcompass-api
```

### docker

```bash
docker run -p 8790:8790 \
  -e FALLCOMPASS_ANTHROPIC_KEY=sk-ant-... \
  ghcr.io/sjgant80-hub/fallcompass-api:latest
```

### docker-compose

```bash
git clone https://github.com/sjgant80-hub/fallcompass-api
cd fallcompass-api
cp .env.example .env  # fill in your keys
docker compose up -d
```

## Env

| Var | Purpose |
|---|---|
| `PORT` | default `8790` |
| `HOST` | default `0.0.0.0` |
| `FALLCOMPASS_AUTH_TOKEN` | if set, requires `Authorization: Bearer <token>` on every request |
| `FALLCOMPASS_<PROVIDER>_KEY` | BYOK for a provider (e.g. `FALLCOMPASS_ANTHROPIC_KEY`) |
| `<PROVIDER>_API_KEY` | fallback naming (e.g. `OPENAI_API_KEY`) |

## Endpoints

### `GET /health`

```bash
curl http://localhost:8790/health
# { "ok": true, "service": "fallcompass-api", "version": "1.0.0", "providers": 8 }
```

### `GET /providers`

```bash
curl http://localhost:8790/providers
```

### `GET /probe`

```bash
curl http://localhost:8790/probe
curl "http://localhost:8790/probe?providers=ollama,anthropic"
```

### `POST /chat`

The cascade. First success wins.

```bash
curl -X POST http://localhost:8790/chat \
  -H 'content-type: application/json' \
  -d '{
    "messages": [{ "role": "user", "content": "One line: why sovereign software wins." }],
    "preferredOrder": ["ollama", "anthropic", "webllm"],
    "maxTokens": 200
  }'
# { "provider": "anthropic", "label": "Anthropic Claude", "reply": "...", "ms": 812 }
```

### `POST /call/:provider`

Bypass the cascade — call one adapter.

```bash
curl -X POST http://localhost:8790/call/openai \
  -H 'content-type: application/json' \
  -d '{ "messages": [{"role":"user","content":"hi"}], "model": "gpt-4o-mini" }'
```

### `POST /keys/:provider` · `DELETE /keys/:provider`

Session-scoped BYOK (prefer env vars for production).

```bash
curl -X POST http://localhost:8790/keys/anthropic \
  -H 'content-type: application/json' \
  -d '{ "key": "sk-ant-..." }'

curl -X DELETE http://localhost:8790/keys/anthropic
```

## Auth

Set `FALLCOMPASS_AUTH_TOKEN` and every request must carry `Authorization: Bearer <token>`. Unset means open (fine for localhost / private networks).

## Companions

- **[fallcompass-sdk](https://github.com/sjgant80-hub/fallcompass-sdk)** — the router library (Node + browser)
- **[fallcompass-mcp](https://github.com/sjgant80-hub/fallcompass-mcp)** — MCP server (Claude Code, Cursor, etc.)

## License

MIT · built by [AI Native Solutions](https://www.ai-nativesolutions.com).
