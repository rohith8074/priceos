# Lyzr Agent API Issue

## Problem

The Lyzr v3 Agent API has a configuration issue where agents created via `/v3/agents/` endpoint fail during inference with:

```
"detail": "1 validation error for LLMConfig\nprovider_id\n  Field required"
```

## Details

- ✅ **Agent Creation**: Succeeds with correct `provider_id: "openai"`
- ✅ **Agent Retrieval**: GET shows agent has all correct config including `provider_id`
- ❌ **Inference**: POST to `/v3/inference/chat/` fails with missing `provider_id` error

### Created Agents (All have config issue)

| Agent | ID | Status |
|-------|-----|--------|
| CRO (original) | `6992c6ade9c656b13d173dc2` | ❌ Inference fails |
| CRO v2 (correct fields) | `6992d34fa460c2aaf2a85194` | ❌ Inference fails |
| Event Intelligence | `6992c6ae63b7d55bbeb5ab2b` | ❌ Likely fails |
| Market Scanner | `6992c6b0ac205f4ba27c69c3` | ❌ Likely fails |
| Pricing Strategy | `6992c6b11de6d4d0944ce3ac` | ❌ Likely fails |

## Attempted Solutions

1. ✅ Added `provider_id: "openai"` to agent creation
2. ✅ Used correct v3 field names (`agent_role`, `agent_instructions` instead of `system_prompt`)
3. ✅ Added `llm_provider_id` to inference request
4. ❌ All still fail with same error

## Workaround Options

### Option 1: Use Lyzr Studio (Recommended)

1. Go to https://studio.lyzr.ai/
2. Sign in with API key: `sk-default-I4Bvqclg0bHffGbz5L0lbwvMo7VMQiiT`
3. Create agents through the UI instead of API
4. Test agents directly in Studio
5. Get working agent IDs
6. Update `src/lib/agents/constants.ts` with working IDs

### Option 2: Wait for Lyzr API Fix

Contact Lyzr support about the `provider_id` validation error in v3 inference endpoint.

### Option 3: Use v2 API

Try using the older v2 API endpoints if available.

## Testing Without Working Agents

The PriceOS application can still be tested with:
- ✅ Mock mode (5 Dubai properties)
- ✅ Database operations
- ✅ UI/UX flows
- ✅ Calendar, bookings, properties pages
- ❌ AI pricing recommendations (blocked by agent issue)

## Next Steps

1. **Test in Lyzr Studio**: Create one agent through the UI and test if inference works
2. **If Studio works**: Create all 4 agents through UI, get IDs, update constants
3. **If Studio fails too**: Contact Lyzr support with this error details

## Agent Prompts Ready

All agent prompts are ready in `scripts/create-agents.ts`:
- CRO (Chief Revenue Officer) - Manager agent
- Event Intelligence - Dubai events monitoring
- Market Scanner - Competitor analysis
- Pricing Strategy - Price optimization

Just need working agent IDs from Lyzr Studio.

---

**Date**: 2026-02-16
**Status**: Blocked on Lyzr API issue
**Workaround**: Manual creation via Lyzr Studio
