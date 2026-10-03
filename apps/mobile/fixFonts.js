const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let original = content;

      content = content.replace(/fontWeight:\s*['"](300|400|500|600|700|800|900|normal|bold)['"]/g, (match, weight) => {
        switch(weight) {
          case '300': return "fontFamily: 'Inter_300Light'";
          case '400': 
          case 'normal': return "fontFamily: 'Inter_400Regular'";
          case '500': return "fontFamily: 'Inter_500Medium'";
          case '600': return "fontFamily: 'Inter_600SemiBold'";
          case '700': 
          case 'bold': return "fontFamily: 'Inter_700Bold'";
          case '800': return "fontFamily: 'Inter_800ExtraBold'";
          case '900': return "fontFamily: 'Inter_900Black'";
          default: return match;
        }
      });

      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed weights in: ' + fullPath);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
