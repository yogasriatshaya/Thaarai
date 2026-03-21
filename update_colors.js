const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

const targets = [
  "Get In Touch", "Fabrics", "Selected Works", "Our Philosophy", "Individuality",
  "Stay Connected", "Customer Service", "Collections", "Aara", "Our Story",
  "Passion & Innovation", "FAQ"
];

function replaceColors(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceColors(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (targets.some(target => line.toLowerCase().includes(target.toLowerCase()))) {
          if (line.includes("#aba0e3")) {
            lines[i] = line.replace(/#aba0e3/g, '#8b7fc0');
            modified = true;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

replaceColors(srcDir);

// Also patch index.css specifically for section-label highlights
let cssPath = path.join(srcDir, 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');
let cssModified = false;
if (cssContent.includes('.section-label')) {
   cssContent = cssContent.replace(/\.section-label\s*{\s*[\s\S]*?color:\s*#aba0e3;/g, match => match.replace('#aba0e3', '#8b7fc0'));
   cssModified = true;
}
if (cssContent.includes('.section-label::after')) {
   cssContent = cssContent.replace(/\.section-label::after\s*{\s*[\s\S]*?background-color:\s*#aba0e3;/g, match => match.replace('#aba0e3', '#8b7fc0'));
   cssModified = true;
}
if (cssModified) {
   fs.writeFileSync(cssPath, cssContent);
   console.log(`Updated CSS: ${cssPath}`);
}
