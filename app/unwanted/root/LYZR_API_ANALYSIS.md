# Lyzr API Schema Analysis

**Date:** 2026-02-16
**OpenAPI Spec:** https://agent-prod.studio.lyzr.ai/openapi.json (saved locally)

## Key Findings

### Agent Creation (`POST /v3/agents/`)

**Required Fields:**
```json
{
  "name": "string",
  "provider_id": "string",  // ✅ REQUIRED
  "model": "string",
  "top_p": "number",
  "temperature": "number"
}
```

**Optional Fields:**
- `agent_role` (replaces old `system_prompt`)
- `agent_instructions`
- `agent_goal`
- `agent_context`
- `description`
- `tools[]`
- `features[]`
- `additional_model_params{}`
- `llm_credential_id`
- etc.

### Chat Inference (`POST /v3/inference/chat/`)

**Required Fields:**
```json
{
  "agent_id": "string",
  "session_id": "string"
}
```

**Optional Fields:**
- `user_id` (default: "default_user")
- `message` (string | null)
- `messages` (array | null)
- `assets[]`
- `llm_provider_id` (string | null)  // ⚠️ Optional override
- `provider_overrides{}` (object | null)
- `role`, `goal`, `instructions`, `model` (runtime overrides)
- `additional_model_params{}`
- `system_prompt_variables{}`
- `filter_variables{}`
- `features[]`
- `simulation_mode` (boolean)
- `internal_call` (boolean)

## Our Agent Configuration

We successfully created 4 agents with:

```typescript
{
  name: "CRO (Chief Revenue Officer)",
  provider_id: "openai",  // ✅ SET CORRECTLY
  model: "gpt-4o",
  temperature: 0.3,
  top_p: 0.9,
  agent_role: "...",
  agent_instructions: "..."
}
```

**Verified via GET `/v3/agents/{agent_id}`:**
```json
{
  "provider_id": "openai"  // ✅ Present in agent config
}
```

## The Bug

**Error during inference:**
```
"detail": "1 validation error for LLMConfig\nprovider_id\n  Field required"
```

**Analysis:**
1. Agent has `provider_id: "openai"` in its stored configuration ✅
2. Inference request doesn't require `llm_provider_id` (it's optional)
3. Backend should read `provider_id` from agent config automatically
4. **BUT:** Backend fails to construct LLMConfig from agent settings

**This is a Lyzr v3 API bug** - the inference endpoint cannot properly load the agent's LLM configuration even though it was set correctly during creation.

## Attempted Fixes

### ✅ Fix 1: Add provider_id to agent creation
```typescript
provider_id: "openai"
```
Result: Agent created successfully, but inference still fails

### ✅ Fix 2: Use correct v3 field names
```typescript
agent_role: "..."      // instead of system_prompt
agent_instructions: "..." // instead of system_prompt
```
Result: Agent created successfully, but inference still fails

### ✅ Fix 3: Add llm_provider_id to inference request
```typescript
{
  agent_id: "...",
  session_id: "...",
  message: "...",
  llm_provider_id: "openai"  // Explicit override
}
```
Result: Still fails with same error

### ❌ Fix 4: All other combinations
Result: Same validation error every time

## Working Solution: Lyzr Studio UI

**Hypothesis:** Agents created through the Lyzr Studio web interface have additional internal configuration that API-created agents lack.

**Workaround:**
1. Go to https://studio.lyzr.ai/
2. Sign in with API key: `sk-default-I4Bvqclg0bHffGbz5L0lbwvMo7VMQiiT`
3. Create agents manually using the UI
4. Get working agent IDs
5. Update `src/lib/agents/constants.ts`

## Next Steps

### Option 1: Manual Creation (Recommended for Now)
Create all 4 agents through Lyzr Studio UI and test inference there first.

### Option 2: Contact Lyzr Support
Report the API bug with details:
- Agents created via `/v3/agents/` POST with correct `provider_id`
- GET confirms agent has `provider_id: "openai"`
- Inference fails: "provider_id Field required" in LLMConfig
- Same error with `llm_provider_id` override in inference request

### Option 3: Try Alternative Endpoints ❌ TESTED - SAME BUG
Tested `/v3/inference/{agent_id}/chat/completions` - **same error**:
```json
{
  "detail": "Failed to chat completions: 400: 1 validation error for LLMConfig
provider_id
  Field required [type=missing, input_value={'model': 'gpt-4o', 'top_...0.9, 'temperature': 0.3}, input_type=dict]"
}
```

Both inference endpoints have the same backend bug.

## Agent Prompts Ready

All 4 agent configurations documented in:
- `scripts/create-agents.ts` (TypeScript with full prompts)
- `AGENT_SETUP.md` (Markdown documentation)

Ready to be copy-pasted into Lyzr Studio UI.

## API Reference

**Created Agents (API - Not Working):**
- CRO: `6992c6ade9c656b13d173dc2`
- Event Intelligence: `6992c6ae63b7d55bbeb5ab2b`
- Market Scanner: `6992c6b0ac205f4ba27c69c3`
- Pricing Strategy: `6992c6b11de6d4d0944ce3ac`

**Test Results:**
- ✅ Agent creation: Success
- ✅ Agent retrieval: Success, config correct
- ❌ Inference: Validation error
