const fs = require('fs');

function replaceAll(str, map) {
  let result = str;
  for (let key in map) {
    result = result.split(key).join(map[key]);
  }
  return result;
}

const toggleRowMap = {
  '.roundRect(-135, -28, 270, 56, 10)': '.roundRect(-165, -32, 330, 64, 15)',
  '.fill({ color: 0xefede0 })': '.fill({ color: 0xffffff })',
  '.stroke({ color: 0xdfdac0, width: 1.5 })': '.stroke({ color: 0xddeaff, width: 2 })',
  'label.position.set(-115, 0)': 'label.position.set(-140, 0)',
  'track.position.set(80, 0)': 'track.position.set(110, 0)',
  'const startX = -115 + labelWidth + 12;': 'const startX = -140 + labelWidth + 15;',
  'const endX = 80 - 50 - 12;': 'const endX = 110 - 50 - 15;',
  '.fill({ color: 0xc0bba0 })': '.fill({ color: 0xccccdd })'
};

const mainMenuMap = {
  ...toggleRowMap,
  'const cardW = 340;': 'const cardW = 420;',
  'const cardH = 300;': 'const cardH = 380;',
  'const musicRowY = -60;': 'const musicRowY = -80;',
  'const sfxRowY = -10;': 'const sfxRowY = -10;',
  '55,\n      "red",\n      230,': '75,\n      "red",\n      250,', // resetBtn Y and width
  'versionText.position.set(0, 110);': 'versionText.position.set(0, 140);'
};

const gameSceneMap = {
  ...toggleRowMap,
  'const cardW = 340;': 'const cardW = 420;',
  'const cardH = 300;': 'const cardH = 360;',
  'const musicRowY = -65;': 'const musicRowY = -75;',
  'const sfxRowY = -15;': 'const sfxRowY = 0;',
  '-75, 45,': '-75, 75,',
  '0, 45,': '0, 75,',
  '75, 45,': '75, 75,',
  'versionText.position.set(0, 100);': 'versionText.position.set(0, 130);'
};

const f1 = 'demo/src/scenes/MainMenuScene.js';
let content1 = fs.readFileSync(f1, 'utf8');
content1 = replaceAll(content1, mainMenuMap);
fs.writeFileSync(f1, content1);

const f2 = 'demo/src/scenes/GameScene.js';
let content2 = fs.readFileSync(f2, 'utf8');
content2 = replaceAll(content2, gameSceneMap);
fs.writeFileSync(f2, content2);

console.log('Layout updated.');
