const fs = require('fs');

function updateFile(file, isGameScene) {
  let content = fs.readFileSync(file, 'utf8');

  // Change createToggleRow signature
  content = content.replace(
    /const createToggleRow = \(labelText, yPos, initialMuteState, onToggle\) => \{/,
    'const createToggleRow = (labelText, yPos, initialMuteState, onToggle, strokeColor = 0xddeaff) => {'
  );

  // Change stroke color
  content = content.replace(
    /\.stroke\(\{ color: 0xddeaff, width: 2 \}\);/g,
    '.stroke({ color: strokeColor, width: 3 });'
  );

  // Update calls
  content = content.replace(
    /const musicRow = createToggleRow\(\s*"NHẠC NỀN",\s*musicRowY,\s*!soundManager\.musicEnabled,\s*\(\) => \{\s*soundManager\.toggleMusic\(\);\s*return !soundManager\.musicEnabled;\s*\}\s*\);/m,
    `const musicRow = createToggleRow(
      "NHẠC NỀN",
      musicRowY,
      !soundManager.musicEnabled,
      () => {
        soundManager.toggleMusic();
        return !soundManager.musicEnabled;
      },
      0x00ccff // Cyan border
    );`
  );

  content = content.replace(
    /const sfxRow = createToggleRow\(\s*"HIỆU ỨNG",\s*sfxRowY,\s*!soundManager\.enabled,\s*\(\) => \{\s*soundManager\.enabled = !soundManager\.enabled;\s*return !soundManager\.enabled;\s*\}\s*\);/m,
    `const sfxRow = createToggleRow(
      "HIỆU ỨNG",
      sfxRowY,
      !soundManager.enabled,
      () => {
        soundManager.enabled = !soundManager.enabled;
        return !soundManager.enabled;
      },
      0xff66cc // Pink border
    );`
  );

  if (isGameScene) {
    // GameScene specific layout
    content = content.replace('const cardH = 360;', 'const cardH = 380;');
    content = content.replace('const musicRowY = -75;', 'const musicRowY = -80;');
    content = content.replace('const sfxRowY = 0;', 'const sfxRowY = -10;');
    
    // They are currently at 45. We change them to 85.
    content = content.replace('-80,\n      45,', '-80,\n      85,');
    content = content.replace('0,\n      45,', '0,\n      85,');
    content = content.replace('80,\n      45,', '80,\n      85,');
    
    content = content.replace('versionText.position.set(0, 130);', 'versionText.position.set(0, 150);');
  }

  fs.writeFileSync(file, content);
}

// only run on GameScene since MainMenu is already fine.
updateFile('demo/src/scenes/GameScene.js', true);

console.log('Update finished.');
