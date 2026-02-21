const fs = require('fs');

function replacePrompt(file, target, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
}

replacePrompt('app/prompts/semantic-data-dictionary.md', '- `calendar_days`', '- (THERE IS NO calendar_days TABLE. USE `inventory_master`)');

