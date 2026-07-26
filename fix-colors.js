const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    let stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, callback);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) callback(p);
  });
}

walk('src', (p) => {
  let content = fs.readFileSync(p, 'utf8');
  let original = content;

  // Replacements
  content = content.replace(/text-app-text dark:text-white/g, 'text-[var(--text-primary)]');
  content = content.replace(/text-white dark:text-app-text/g, 'text-[var(--bg-color)]');
  content = content.replace(/bg-app-text dark:bg-white/g, 'bg-[var(--text-primary)]');
  
  content = content.replace(/bg-app-text dark:bg-dark-text text-white dark:text-dark-bg/g, 'bg-[var(--text-primary)] text-[var(--bg-color)]');
  
  content = content.replace(/text-white dark:text-dark-bg/g, 'text-[var(--bg-color)]');
  content = content.replace(/bg-app-text text-white dark:bg-white dark:text-app-text/g, 'bg-[var(--text-primary)] text-[var(--bg-color)]');
  
  content = content.replace(/text-app-text-muted/g, 'text-[var(--text-muted)]');
  content = content.replace(/text-app-text-sub dark:text-dark-text2/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-app-text dark:text-dark-text/g, 'text-[var(--text-primary)]');

  // Some more variants found in grep
  content = content.replace(/text-app-text/g, 'text-[var(--text-primary)]');
  
  if (original !== content) {
    fs.writeFileSync(p, content);
    console.log('Fixed colors in ' + p);
  }
});
