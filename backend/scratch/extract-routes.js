const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'src', 'modules');
const outputLines = [];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.routes.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      outputLines.push(`### ${file}`);
      for (const line of lines) {
        if (line.includes('router.get') || line.includes('router.post') || line.includes('router.patch') || line.includes('router.put') || line.includes('router.delete')) {
          outputLines.push('- ' + line.trim());
        }
      }
      outputLines.push('');
    }
  }
}

scanDirectory(modulesDir);

const outPath = path.join(process.env.USERPROFILE, '.gemini', 'antigravity-ide', 'brain', 'fc47abe0-4279-4e4b-bffc-01b72501456e', 'backend_api_routes.md');
fs.writeFileSync(outPath, outputLines.join('\n'));
console.log('Written to', outPath);
