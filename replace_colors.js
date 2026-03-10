const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');
files.push('src/navigation/AppNavigator.tsx');

const colorMap = {
  '\u0027#0A0A1A\u0027': 'COLORS.background',
  '"#0A0A1A"': 'COLORS.background',
  '\u0027#D4AF37\u0027': 'COLORS.primary',
  '"#D4AF37"': 'COLORS.primary',
  '\u0027#8A8A9E\u0027': 'COLORS.textSecondary',
  '"#8A8A9E"': 'COLORS.textSecondary',
  '\u0027#FFFFFF\u0027': 'COLORS.textMain',
  '"#FFFFFF"': 'COLORS.textMain',
  '\u0027#FFF\u0027': 'COLORS.textMain',
  '"#FFF"': 'COLORS.textMain',
  '\u0027#111122\u0027': 'COLORS.modalBackground',
  '"#111122"': 'COLORS.modalBackground',
  '\u0027rgba(212, 175, 55, 0.1)\u0027': 'COLORS.primaryLight',
  '"rgba(212, 175, 55, 0.1)"': 'COLORS.primaryLight',
  '\u0027rgba(212, 175, 55, 0.2)\u0027': 'COLORS.primaryBorder',
  '"rgba(212, 175, 55, 0.2)"': 'COLORS.primaryBorder',
  '\u0027rgba(212, 175, 55, 0.3)\u0027': 'COLORS.primaryBorder',
  '"rgba(212, 175, 55, 0.3)"': 'COLORS.primaryBorder',
  '\u0027rgba(212, 175, 55, 0.5)\u0027': 'COLORS.primaryBorder',
  '"rgba(212, 175, 55, 0.5)"': 'COLORS.primaryBorder',
  '\u0027rgba(212, 175, 55, 0.05)\u0027': 'COLORS.primaryLight',
  '"rgba(212, 175, 55, 0.05)"': 'COLORS.primaryLight',
  '\u0027rgba(255, 255, 255, 0.05)\u0027': 'COLORS.cardBackground',
  '"rgba(255, 255, 255, 0.05)"': 'COLORS.cardBackground',
  '\u0027rgba(255, 255, 255, 0.1)\u0027': 'COLORS.whiteLight',
  '"rgba(255, 255, 255, 0.1)"': 'COLORS.whiteLight',
  '\u0027rgba(255, 255, 255, 0.3)\u0027': 'COLORS.whiteMedium',
  '"rgba(255, 255, 255, 0.3)"': 'COLORS.whiteMedium',
  '\u0027rgba(0, 0, 0, 0.7)\u0027': 'COLORS.overlay',
  '"rgba(0, 0, 0, 0.7)"': 'COLORS.overlay',
};

files.forEach(file => {
  if (file === 'src/constants/theme.ts' || !fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  let originalCode = code;

  // Add import if not present and we match any colors
  let needsImport = false;
  for (const [find, replace] of Object.entries(colorMap)) {
    if (code.includes(find)) needsImport = true;
    code = code.split(find).join(replace);
  }

  // Also replace color="..." to color={...}
  code = code.replace(/color="COLORS\.([^"]+)"/g, 'color={COLORS.$1}');
  code = code.replace(/placeholderTextColor="COLORS\.([^"]+)"/g, 'placeholderTextColor={COLORS.$1}');
  
  if (needsImport && !code.includes('import { COLORS }')) {
    // Find last import
    const lastImportIndex = code.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = code.indexOf('\n', lastImportIndex);
      // count depth to go out of folders. src/screens -> ../constants/theme
      const relativePath = file.includes('AppNavigator') ? '../constants/theme' : '../constants/theme';
      // calculate correct relative path
      let importPath = '../constants/theme';
      if (file.startsWith('src/screens/')) importPath = '../constants/theme';
      else if (file.startsWith('src/navigation/')) importPath = '../constants/theme';
      else if (file === 'AppNavigator.tsx') importPath = './constants/theme';
      
      code = code.slice(0, endOfLine) + `\nimport { COLORS } from '${importPath}'` + code.slice(endOfLine);
    } else {
      code = `import { COLORS } from '../constants/theme'\n` + code;
    }
  }

  if (code !== originalCode) {
    fs.writeFileSync(file, code);
    console.log('Updated ' + file);
  }
});
