const fs = require('fs');

const path = './src/app/(dashboard)/db-viewer/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replacements
content = content.replace(/background: "#0f1117"/g, 'backgroundColor: "hsl(var(--background))"');
content = content.replace(/color: "#e4e7f1"/g, 'color: "hsl(var(--foreground))"');
content = content.replace(/background: "#1a1d27"/g, 'backgroundColor: "hsl(var(--card))"');
content = content.replace(/background: "#12141c"/g, 'backgroundColor: "hsl(var(--background))"');
content = content.replace(/background: activeTable === t\.key \? "#222633" : "#1a1d27"/g, 'backgroundColor: activeTable === t.key ? "hsl(var(--muted))" : "hsl(var(--card))"');
content = content.replace(/background: activeTable === t\.key \? t\.color \+ "30" : "#1a1d27"/g, 'backgroundColor: activeTable === t.key ? t.color + "30" : "hsl(var(--card))"');
content = content.replace(/border: "1px solid #2d3348"/g, 'border: "1px solid hsl(var(--border))"');
content = content.replace(/borderBottom: "1px solid #2d3348"/g, 'borderBottom: "1px solid hsl(var(--border))"');
content = content.replace(/border: \`2px solid \$\{activeTable === t\.key \? t\.color : "#2d3348"\}\`/g, 'border: `2px solid ${activeTable === t.key ? t.color : "hsl(var(--border))"}`');
content = content.replace(/border: \`1px solid \$\{activeTable === t\.key \? t\.color : "#2d3348"\}\`/g, 'border: `1px solid ${activeTable === t.key ? t.color : "hsl(var(--border))"}`');
content = content.replace(/color: "#8b90a5"/g, 'color: "hsl(var(--muted-foreground))"');
content = content.replace(/background: loading \? "#2d3348" : "linear-gradient\(135deg, #6c5ce7, #00cec9\)"/g, 'background: loading ? "hsl(var(--muted))" : "linear-gradient(135deg, #6c5ce7, #00cec9)"');

fs.writeFileSync(path, content);
console.log('Fixed db-viewer colors');
