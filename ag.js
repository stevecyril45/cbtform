#!/usr/bin/env node
// Save this as: ag.js (in root) OR scripts/ag.js

const { execSync } = require('child_process');
const args = process.argv.slice(2);

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

let featureName = null;
args.forEach(arg => {
  if (arg.startsWith('--')) featureName = arg.slice(2).trim();
});

if (!featureName || featureName === 'help' || featureName === 'h') {
  console.clear(); // optional: clean screen for beauty
  console.log(`
${c.bold}${c.magenta}╔══════════════════════════════════════╗${c.reset}
${c.bold}${c.magenta}║   Afro Gift Angular Generator (ag)   ║${c.reset}
${c.bold}${c.magenta}╚══════════════════════════════════════╝${c.reset}

${c.bold}${c.cyan}Generate full feature modules in seconds!${c.reset}

${c.yellow}Correct usage (Windows + macOS + Linux):${c.reset}

   ${c.green}npm run agmc -- --user${c.reset}
   ${c.green}npm run agmc -- --smtp${c.reset}
   ${c.green}npm run agmc -- --payment${c.reset}
   ${c.green}npm run agmc -- --booking${c.reset}
   ${c.green}npm run agmc -- --anything-you-want${c.reset}

${c.bold}${c.blue}This creates:${c.reset}
   ├─ src/app/your-feature/
   │   ├─ your-feature.module.ts
   │   ├─ your-feature-routing.module.ts
   │   ├─ index/     ${c.dim}(list page)${c.reset}
   │   ├─ new/       ${c.dim}(create form)${c.reset}
   │   └─ view/      ${c.dim}(detail page)${c.reset}

${c.bold}Aliases:${c.reset}  npm run ag   •   npm run agm   •   npm run agmc

${c.dim}Just type any name after double dash → full feature ready!${c.reset}

${c.bold}${c.magenta}Made with love for Afro Gift Team${c.reset}
`);
  process.exit(0);
}

// Validate name
if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(featureName)) {
  console.log(`\n${c.red}Invalid name: "${featureName}"${c.reset}`);
  console.log(`${c.yellow}Only letters, numbers, no spaces or special chars.\n${c.reset}`);
  process.exit(1);
}

const pretty = featureName.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

console.log(`\n${c.bold}${c.green}Generating "${pretty}" feature module...${c.reset}\n`);

const cmds = [
  `ng g m ${featureName} --routing=true`,
  `ng g c ${featureName}/index --module=${featureName}`,
  `ng g c ${featureName}/new --module=${featureName}`,
  `ng g c ${featureName}/view --module=${featureName}`
];

cmds.forEach((cmd, i) => {
  console.log(`  ${c.dim}[${i+1}/4]${c.reset} ${c.cyan}→${c.reset} ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.log(`\n${c.red}Failed at step ${i+1}${c.reset}`);
    process.exit(1);
  }
});

console.log(`\n${c.bold}${c.green}SUCCESS! "${pretty}" feature generated!${c.reset}`);
console.log(`${c.cyan}Happy coding, Afro Gift Team!\n${c.reset}`);
