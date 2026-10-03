const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('No errors!');
} catch (error) {
  const output = error.stdout.toString();
  const lines = output.split('\n');
  
  const filesToEdit = {}; // path -> array of lines to delete
  
  lines.forEach(line => {
    // Match: src/screens/requests/CreateRequestScreen.tsx(638,5): error TS1117: ...
    const match = line.match(/^(.+\.tsx?)\((\d+),\d+\): error TS1117/);
    if (match) {
      const file = path.join(process.cwd(), match[1]);
      const lineNum = parseInt(match[2], 10);
      
      if (!filesToEdit[file]) filesToEdit[file] = [];
      filesToEdit[file].push(lineNum);
    }
  });

  for (const [file, lineNums] of Object.entries(filesToEdit)) {
    if (fs.existsSync(file)) {
      const fileLines = fs.readFileSync(file, 'utf8').split('\n');
      
      // Sort descending to not mess up indexes when splicing
      lineNums.sort((a, b) => b - a);
      
      for (const lineNum of lineNums) {
        // Line numbers are 1-based, array is 0-based
        const idx = lineNum - 1;
        console.log(`Deleting line ${lineNum} in ${file}`);
        fileLines.splice(idx, 1);
      }
      
      fs.writeFileSync(file, fileLines.join('\n'));
    }
  }
}
