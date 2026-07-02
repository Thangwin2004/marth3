const fs = require('fs');

function updateFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/this\.createCircularButton\(\s*"🏠",\s*-80,\s*45/g, 'this.createCircularButton(\n      "🏠",\n      -80,\n      85');
  content = content.replace(/this\.createCircularButton\(\s*"🔄",\s*0,\s*45/g, 'this.createCircularButton(\n      "🔄",\n      0,\n      85');
  content = content.replace(/this\.createCircularButton\(\s*"▶️",\s*80,\s*45/g, 'this.createCircularButton(\n      "▶️",\n      80,\n      85');

  fs.writeFileSync(file, content);
}

updateFile('demo/src/scenes/GameScene.js');
console.log('Update finished.');
