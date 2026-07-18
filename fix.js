const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/\.(map|forEach|find|filter)\s*\(\s*([a-zA-Z0-9_]+)\s*=>/g, '.$1(($2: any) =>');
  
  if (original !== content) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
