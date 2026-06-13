const fs = require('fs');
const path = require('path');

const origPath = path.join(__dirname, 'orig_page.tsx');
if (!fs.existsSync(origPath)) {
  console.error('orig_page.tsx not found!');
  process.exit(1);
}

let content = fs.readFileSync(origPath, 'utf-8');

// Replacements for high contrast text:
// Replaces Slate-400 (light grey) with Slate-700 (light mode) / Slate-300 (dark mode)
content = content.replace(/text-slate-400(?! hover:text)/g, 'text-slate-700 dark:text-slate-300');

// Replaces Slate-500 (mid grey) with Slate-800 (light mode) / Slate-200 (dark mode)
content = content.replace(/text-slate-500/g, 'text-slate-800 dark:text-slate-200');

// Replaces Slate-600 (dark grey) with Slate-900 (light mode) / Slate-100 (dark mode)
content = content.replace(/text-slate-600/g, 'text-slate-900 dark:text-slate-100');

// Replaces back to command link hover text:
content = content.replace(/text-slate-400 hover:text-indigo-400/g, 'text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400');

// Replace faint borders/dividers with high-contrast borders:
content = content.replace(/border-white\/5/g, 'border-slate-300 dark:border-slate-800');
content = content.replace(/border-white\/10/g, 'border-slate-350 dark:border-white/20');
content = content.replace(/divide-white\/5/g, 'divide-slate-250 dark:divide-slate-800');

// Write back to the source location
const targetPath = path.join(__dirname, '../src/app/dashboard/finance/page.tsx');
fs.writeFileSync(targetPath, content);
console.log('High-contrast styles successfully applied to original page.tsx!');
