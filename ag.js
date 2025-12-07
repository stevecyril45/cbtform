#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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

let input = null;
args.forEach(arg => {
  if (arg.startsWith('--')) input = arg.slice(2).trim();
});

if (!input || input === 'help' || input === 'h') {
  console.clear();
  console.log(`
${c.bold}${c.magenta}╔══════════════════════════════════════════╗${c.reset}
${c.bold}${c.magenta}║   Afro Gift Angular Generator (ag.js)    ║${c.reset}
${c.bold}${c.magenta}╚══════════════════════════════════════════╝${c.reset}

${c.bold}${c.cyan}Available commands:${c.reset}

${c.green}Feature Module (with index/new/view):${c.reset}
   npm run agmc -- --user
   npm run agmc -- --booking

${c.green}Service in shared/services/:${c.reset}
   npm run agms -- --card
   npm run agms -- --auth

${c.yellow}If folder exists → use "r" to force remove + recreate:${c.reset}
   npm run agmcr -- --user    ${c.dim}// removes + regenerates module${c.reset}
   npm run agmsr -- --card    ${c.dim}// removes + regenerates service${c.reset}

${c.bold}Aliases:${c.reset}
   ag, agm, agmc, agms, agmcr, agmsr

${c.bold}${c.magenta}Made with love for Afro Gift Team ❤️${c.reset}
  `);
  process.exit(0);
}

// Parse command type from script name
const scriptName = path.basename(process.argv[1]);
const isService = scriptName.includes('agms');
const isForceRemove = scriptName.includes('agmcr') || scriptName.includes('agmsr');

let featureName = input.replace(/^r-?/, ''); // remove leading 'r-' if present
const wasForceRequested = input.startsWith('r-') || isForceRemove;

if (!featureName || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(featureName)) {
  console.log(`\n${c.red}Invalid name: "${featureName}"${c.reset}`);
  console.log(`${c.yellow}Use letters and numbers only. Example: --user, --card\n${c.reset}`);
  process.exit(1);
}

const pretty = featureName.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

// Paths
const modulePath = path.join('src/app', featureName);
const servicePath = path.join('src/app/shared/services', featureName);
const targetPath = isService ? servicePath : modulePath;

// Check if exists
const exists = fs.existsSync(targetPath);

if (exists && !isForceRemove && !wasForceRequested) {
  console.log(`\n${c.red}Already exists:${c.reset} ${targetPath}`);
  console.log(`${c.yellow}To overwrite and regenerate, use:${c.reset}`);
  console.log(`   npm run ${isService ? 'agmsr' : 'agmcr'} -- --${featureName}\n`);
  process.exit(1);
}

if ((isForceRemove || wasForceRequested) && exists) {
  console.log(`${c.yellow}Removing existing folder:${c.reset} ${targetPath}`);
  execSync(`rm -rf "${targetPath}"`, { stdio: 'inherit' });
  console.log(`${c.green}Removed successfully!${c.reset}\n`);
}

// Now generate
console.log(`${c.bold}${c.green}Generating "${pretty}" ${isService ? 'Service' : 'Feature Module'}...${c.reset}\n`);

try {
  if (isService) {
    // Generate Service
    const cmd = `ng g s shared/services/${featureName} --skip-tests=true`;
    console.log(`  ${c.cyan}→${c.reset} ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
  } else {
    // Generate Full Feature Module
    const cmds = [
      `ng g m ${featureName} --routing=true`,
      `ng g c ${featureName}/index --module=${featureName} --skip-tests=true`,
      `ng g c ${featureName}/new --module=${featureName} --skip-tests=true`,
      `ng g c ${featureName}/view --module=${featureName} --skip-tests=true`
    ];

    cmds.forEach((cmd, i) => {
      console.log(`  ${c.dim}[${i+1}/${cmds.length}]${c.reset} ${c.cyan}→${c.reset} ${cmd}`);
      execSync(cmd, { stdio: 'inherit' });
    });
  }

  console.log(`\n${c.bold}${c.green}SUCCESS! "${pretty}" ${isService ? 'service' : 'feature'} generated!${c.reset}`);
  console.log(`${c.cyan}Happy coding, Afro Gift Team! 🚀\n${c.reset}`);

} catch (error) {
  console.log(`\n${c.red}Generation failed. Check Angular CLI and try again.${c.reset}`);
  process.exit(1);
}
