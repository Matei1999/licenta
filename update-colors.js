// Script pentru actualizarea automată a culorilor în întreaga aplicație
// Rulează cu: node update-colors.js

const fs = require('fs');
const path = require('path');

// Mapping-ul culorilor vechi către cele noi
const colorMap = {
  // Culori teal/verde vechi → cyan/blue noi
  '#14b8a6': 'primary',           // teal-500 → primary (cyan-600)
  '#0d9488': 'primary-hover',     // teal-600 → primary-hover
  '#065f46': 'text-primary',      // teal-900 → text-primary (slate)
  '#0f766e': 'primary-hover',     // teal-700 → primary-hover
  '#f0fdfa': 'bg-surface',        // teal-50 → bg-surface
  '#ccfbf1': 'primary-light',     // teal-100 → primary-light (cyan-50)
  '#5eead4': 'primary',           // teal-300 → primary
  '#2dd4bf': 'primary',           // teal-400 → primary
  '#115e59': 'text-primary',      // teal-800 → text-primary
};

// Funcție pentru a găsi toate fișierele JS/JSX într-un director
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules și build
      if (!['node_modules', 'build', '.git'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Funcție pentru a înlocui culorile în fișier
function updateColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Înlocuiește fiecare culoare veche cu clasa Tailwind nouă
  Object.entries(colorMap).forEach(([oldColor, newClass]) => {
    // Pattern pentru bg-[#color]
    const bgPattern = new RegExp(`bg-\\[${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
    if (bgPattern.test(content)) {
      content = content.replace(bgPattern, `bg-${newClass}`);
      modified = true;
    }
    
    // Pattern pentru text-[#color]
    const textPattern = new RegExp(`text-\\[${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
    if (textPattern.test(content)) {
      content = content.replace(textPattern, `text-${newClass}`);
      modified = true;
    }
    
    // Pattern pentru border-[#color]
    const borderPattern = new RegExp(`border-\\[${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
    if (borderPattern.test(content)) {
      content = content.replace(borderPattern, `border-${newClass}`);
      modified = true;
    }
    
    // Pattern pentru ring-[#color]
    const ringPattern = new RegExp(`ring-\\[${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
    if (ringPattern.test(content)) {
      content = content.replace(ringPattern, `ring-${newClass}`);
      modified = true;
    }
    
    // Pattern pentru hover:bg-[#color]
    const hoverBgPattern = new RegExp(`hover:bg-\\[${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
    if (hoverBgPattern.test(content)) {
      content = content.replace(hoverBgPattern, `hover:bg-${newClass}`);
      modified = true;
    }
    
    // Pattern pentru focus:ring-[#color]
    const focusRingPattern = new RegExp(`focus:ring-\\[${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
    if (focusRingPattern.test(content)) {
      content = content.replace(focusRingPattern, `focus:ring-${newClass}`);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const frontendSrc = path.join(__dirname, 'frontend', 'src');
console.log('🎨 Starting color update process...\n');
console.log(`Scanning directory: ${frontendSrc}\n`);

const files = findFiles(frontendSrc);
let updatedCount = 0;

files.forEach(file => {
  if (updateColorsInFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✅ Process complete!`);
console.log(`📊 Files scanned: ${files.length}`);
console.log(`📝 Files updated: ${updatedCount}`);
console.log(`\n💡 Note: Manual review recommended for complex cases.`);
