# ARGUS n8n Workflows - C.CODE Refactoring Guide

## Overview

This refactoring removes direct Claude AI chat/content generation calls and consolidates all code generation through **C.CODE** - a specialized AI mode that ONLY generates code/workflows, not product designs or content.

## Architecture Changes

### Before:
- Multiple Claude API calls for different purposes (video scripts, email summaries, reel ideas)
- No centralized memory system
- Mixed concerns: product design + code generation

### After:
- Single C.CODE endpoint for workflow generation only
- ARGUS_MEMORY: centralized static data store
- Clear separation: C.CODE generates code, workflows do data processing

## New Files

### 1. ARGUS_MEMORY_CORE.json
**Purpose:** Centralized memory store using n8n static data

**Operations:**
- `GET`: Retrieve current ARGUS_MEMORY state
- `SET`: Update entire memory object
- `UPDATE_FIELD`: Update single field

**Schema:**
```json
{
  "project": "ARGUS n8n Automation System",
  "stage": "refactoring",
  "data_source": "static_data",
  "rules": [
    "C.CODE generates ONLY code/workflows, NO product design",
    "All AI calls go through C.CODE endpoint",
    "ARGUS_MEMORY is read-only for generated workflows"
  ],
  "no_go": [
    "No direct Claude API calls for content generation",
    "No product design or UX suggestions"
  ],
  "last_action": "string",
  "next_step": "string"
}
```

**Usage:**
- Call this workflow from other workflows via Execute Workflow node
- Pass `{ "operation": "GET" }` to retrieve memory
- Pass `{ "operation": "SET", "newMemory": {...} }` to update

### 2. ÜRETİM_HATTI_V2_CCODE.json
**Purpose:** Refactored workflow builder using C.CODE principles

**Changes from original:**
- ✅ Added ARGUS_MEMORY GET at workflow start
- ✅ Removed all AI content generation (video scripts, email summaries, reel ideas)
- ✅ Removed: `needsAI`, `needsVideoGeneration` patterns
- ✅ Workflows now do DATA PROCESSING ONLY
- ✅ No Shotstack video generation
- ✅ No Claude API calls for content

**Workflow generates:**
- YouTube trending analysis (data only, no AI insights)
- Gmail notifications (raw data, no AI summaries)
- Crypto price monitoring (numbers only)
- Telegram notifications with processed data

**C.CODE Rules embedded:**
- "You are C.CODE. You do NOT design products. You ONLY write code or n8n workflow JSON."
- ARGUS_MEMORY context passed to all generated workflows
- Metadata includes `generatedBy: "C.CODE"`

### 3. ANAFLOW_V2_CCODE.json
**Purpose:** Refactored Telegram interface using C.CODE mode

**Changes from original:**
- ✅ Removed ARGUS chatbot personality
- ✅ Added ARGUS_MEMORY integration
- ✅ C.CODE system prompt (task parsing only, no chat)
- ✅ Simplified: only routes to workflow creation
- ✅ No product design or general chat

**Flow:**
1. Telegram message arrives
2. Parse message
3. GET ARGUS_MEMORY
4. Build C.CODE prompt with memory context
5. Call Claude API (C.CODE mode - task parsing only)
6. Parse response
7. Route action:
   - `create_n8n_flow` → Call ÜRETİM_HATTI_V2_CCODE
   - `none` → Return "C.CODE only generates workflows"
8. Send Telegram response

**C.CODE Prompt:**
```
You are C.CODE. You do NOT design products. You ONLY write code or n8n workflow JSON.

Your task: Parse the user's natural language command into a structured action.

ARGUS_MEMORY Context: [injected]

Return ONLY:
{
  "action": {
    "type": "create_n8n_flow" | "none",
    "params": { "description": "..." }
  },
  "reply": "..."
}
```

## Migration Steps

### 1. Import New Workflows
```bash
# Import to n8n:
# 1. ARGUS_MEMORY_CORE.json
# 2. ÜRETİM_HATTI_V2_CCODE.json
# 3. ANAFLOW_V2_CCODE.json
```

### 2. Update Workflow IDs
After importing ARGUS_MEMORY_CORE, copy its workflow ID and update:
- `ÜRETİM_HATTI_V2_CCODE.json` → "GET ARGUS_MEMORY" node → `workflowId` parameter
- `ANAFLOW_V2_CCODE.json` → "GET ARGUS_MEMORY" node → `workflowId` parameter

### 3. Test ARGUS_MEMORY
Execute ARGUS_MEMORY_CORE manually:
- Input: `{ "operation": "GET" }`
- Expected output: Memory object with schema fields

### 4. Test Workflow Generation
Send Telegram message to ANAFLOW_V2_CCODE webhook:
```json
{
  "message": {
    "chat": { "id": 123456 },
    "from": { "username": "test" },
    "text": "YouTube'dan popüler videoları çek"
  }
}
```

Expected: Workflow created with data processing only, no AI content generation

### 5. Deactivate Old Workflows
Once tested:
- Deactivate `ÜRETİM HATTI.json` (old version)
- Deactivate `ANAFLOW.json` (old version)
- Keep as backup but use V2 versions going forward

## Key Differences

| Feature | Old System | New C.CODE System |
|---------|-----------|------------------|
| **AI Usage** | Multiple calls (chat, content, scripts) | Single C.CODE endpoint (task parsing only) |
| **Memory** | None | ARGUS_MEMORY static data |
| **Video Generation** | Shotstack integration | Removed (data processing only) |
| **Email Summary** | AI-generated summaries | Raw data only |
| **YouTube Analysis** | AI script generation | Engagement metrics only |
| **Chatbot** | ARGUS personality | C.CODE (workflow generation only) |

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - For C.CODE API calls (task parsing)
- `TELEGRAM_BOT_TOKEN` - For Telegram integration
- `YOUTUBE_API_KEY` - For YouTube data
- `N8N_API_KEY` - For workflow creation
- `TWILIO_*` - For phone call integration (optional)

Removed:
- `SHOTSTACK_API_KEY` - No longer needed (video generation removed)

## C.CODE Principles

1. **No Product Design**: C.CODE does not suggest features, UI/UX, or product improvements
2. **Code Only**: Generates n8n workflow JSON or code snippets
3. **Task-Driven**: Requires concrete TASK_DESCRIPTION, not vague requirements
4. **Memory-Aware**: Always receives ARGUS_MEMORY context
5. **Data Processing**: Generated workflows process data, don't generate content

## Troubleshooting

### "ARGUS_MEMORY not found"
- Ensure ARGUS_MEMORY_CORE workflow is imported and active
- Update workflow IDs in Execute Workflow nodes

### "C.CODE returns chat responses"
- Check system prompt in ANAFLOW_V2_CCODE
- Ensure prompt includes: "You are C.CODE. You do NOT design products."

### "Generated workflows still call Claude API"
- Check ÜRETİM_HATTI_V2_CCODE code
- Ensure `needsAI` pattern is removed
- Verify no Anthropic/OpenAI URLs in generated nodes

## Next Steps

1. Monitor ARGUS_MEMORY usage and update `last_action`/`next_step` fields
2. Add more C.CODE rules to memory as needed
3. Extend workflow patterns in ÜRETİM_HATTI_V2_CCODE (data processing only)
4. Consider adding C.CODE validation: reject non-code requests early

## Support

For issues or questions about this refactoring:
1. Check ARGUS_MEMORY state: Execute ARGUS_MEMORY_CORE with `GET` operation
2. Review workflow execution logs in n8n
3. Verify C.CODE prompt includes full ARGUS_MEMORY context
