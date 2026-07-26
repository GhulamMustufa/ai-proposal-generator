const fs = require('fs');
const file = 'apps/web/src/lib/built-in-personas.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\s*idealSalary:\s*'.*?',/g, '');
fs.writeFileSync(file, content);
