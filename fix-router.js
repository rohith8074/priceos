const fs = require('fs');

let content = fs.readFileSync('updated_prompts/01-cro-router.md', 'utf8');

// The issue is likely that the prompt is too confusing about multiple agents 
// so the LLM invokes them all every time. We will explicitly tell it to STOP and ONLY invoke what is strictly necessary.

const explicitWarning = `
### DO:
0. **MINIMAL ROUTING**: ONLY invoke the specific sub-agents necessary for the user's exact query. If the user only asks for "booking rate", ONLY invoke \`@BookingIntelligence\`. DO NOT execute a full pricing analysis unless explicitly requested. Do not invent a loop.
`;

content = content.replace('### DO:', explicitWarning);

fs.writeFileSync('updated_prompts/01-cro-router.md', content);
