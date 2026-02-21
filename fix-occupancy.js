const fs = require('fs');

function fixPrompt(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add explicit note about 'reserved' vs 'booked'
  const filterInstruction = `
MUST USE \`status = 'reserved'\` for booked days! DO NOT use \`status = 'booked'\`.
`;

  content = content.replace('### DO:', '### DO:\n0. ' + filterInstruction);

  fs.writeFileSync(file, content);
}

fixPrompt('updated_prompts/02-property-analyst.md');
fixPrompt('updated_prompts/03-booking-intelligence.md');
