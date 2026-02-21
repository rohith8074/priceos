const fs = require('fs');

let content = fs.readFileSync('updated_prompts/03-booking-intelligence.md', 'utf8');

// The issue is that the LLM is trying to query "calendar_days" and "reservations" instead of "inventory_master" and "activity_timeline" (where type = 'reservation').

const explicitReplacement = `
### DO:
0. MUST ONLY QUERY \`inventory_master\`, \`listings\`, and \`activity_timeline\`. THERE IS NO \`calendar_days\` OR \`reservations\` TABLE! DO NOT USE THEM!
`;

content = content.replace('### DO:', explicitReplacement);

fs.writeFileSync('updated_prompts/03-booking-intelligence.md', content);
