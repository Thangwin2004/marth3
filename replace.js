const fs = require('fs');
const files = [
  'demo/src/system/UIComponents.js', 
  'demo/src/scenes/MainMenuScene.js', 
  'demo/src/scenes/GameScene.js'
];
files.forEach(f => {
  let lines = fs.readFileSync(f, 'utf8').split('\n');
  let hoverCountdown = 0;
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('pointerover')) {
      hoverCountdown = 4; // match if playClick is within 4 lines after pointerover
    }
    
    if (hoverCountdown > 0 && lines[i].includes('soundManager.playClick()')) {
      lines[i] = lines[i].replace(/soundManager\.playClick\(\);?/g, '// soundManager.playClick();');
      count++;
      hoverCountdown = 0; // successfully replaced for this block
    }
    
    if (hoverCountdown > 0) hoverCountdown--;
  }
  
  if (count > 0) {
    fs.writeFileSync(f, lines.join('\n'));
    console.log('Replaced ' + count + ' in ' + f);
  }
});
