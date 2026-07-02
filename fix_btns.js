const fs = require('fs');

const f = 'demo/src/scenes/GameScene.js';
let content = fs.readFileSync(f, 'utf8');

content = content.replace('-80,\n      45,', '-80,\n      75,');
content = content.replace('0,\n      45,', '0,\n      75,');
content = content.replace('80,\n      45,', '80,\n      75,');
content = content.replace('versionText.position.set(0, 110);', 'versionText.position.set(0, 130);');

fs.writeFileSync(f, content);

const f2 = 'demo/src/scenes/MainMenuScene.js';
let content2 = fs.readFileSync(f2, 'utf8');
content2 = content2.replace('versionText.position.set(0, 110);', 'versionText.position.set(0, 145);');
fs.writeFileSync(f2, content2);
