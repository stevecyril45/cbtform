#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  cyan: '\x1b[96m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  red: '\x1b[91m',
  purple: '\x1b[95m',
  orange: '\x1b[38;5;214m',
  pink: '\x1b[38;5;205m',
  dim: '\x1b[2m',

  // ADD THESE MISSING ONES NOW
  white: '\x1b[97m',           // Bright white text
  bgGreen: '\x1b[42m',         // Green background
  bgWhite: '\x1b[107m',        // White background
  bgCyan: '\x1b[46m',          // Keep if you want fallback
};

// CRITICAL: Detect which npm script was used
const npmScriptName = (process.env.npm_lifecycle_event || '').toLowerCase();

// Extract name after --
let name = null;
process.argv.forEach(arg => {
  if (arg.startsWith('--')) {
    name = arg.slice(2).trim().toLowerCase().replace(/^r-?/i, '');
  }
});
if (!name || name === 'help') {
  console.clear();
  console.log(`
${c.bgGreen}${c.bold}${c.white}                                                                                                   ${c.reset}
${c.bgGreen}${c.bold}${c.white}    █████╗  ██████╗  ██████╗ ██████╗ ██╗     ██╗         ${c.bgWhite}${c.green}${c.bold} AGCLi v3.0 — Afro Gift CLI ${c.reset}${c.bgGreen}${c.white}     ${c.reset}
${c.bgGreen}${c.bold}${c.white}   ██╔══██╗██╔════╝ ██╔════╝██╔═══██╗██║     ██║            ${c.green}One CLI. Total Domination.${c.reset}${c.bgGreen}${c.white}     ${c.reset}
${c.bgGreen}${c.bold}${c.white}   ███████║██║  ███╗██║     ██║   ██║██║     ██║         ${c.green}Frontend • Backend • Fire${c.reset}${c.bgGreen}${c.white}           ${c.reset}
${c.bgGreen}${c.bold}${c.white}   ██╔══██║██║   ██║██║     ██║   ██║██║     ██║                                      ${c.reset}
${c.bgGreen}${c.bold}${c.white}   ██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗                                ${c.reset}
${c.bgGreen}${c.bold}${c.white}   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝                                ${c.reset}
${c.reset}

${c.bold}${c.green}╔══════════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.bold}${c.green}║                     AGCLi — Afro Gift Command Line Interface                     ║${c.reset}
${c.bold}${c.green}╚══════════════════════════════════════════════════════════════════════════════════╝${c.reset}

${c.green}${c.bold}FRONTEND COMMANDS (Angular)                          BACKEND COMMANDS (Node.js Services)${c.reset}

${c.green}Generate Feature Module                 Generate Backend Service${c.reset}
   ${c.yellow}npm run agmc   -- --user${c.reset}               ${c.yellow}npm run ags    -- --user${c.reset}
   ${c.yellow}npm run agmc   -- --wallet${c.reset}             ${c.yellow}npm run ags    -- --payment${c.reset}

${c.green}Generate Angular Service                 Force Regenerate (Deletes & Recreates)${c.reset}
   ${c.yellow}npm run agms   -- --auth${c.reset}               ${c.red}npm run ags    -- --card    ${c.dim}(overwrites existing)${c.reset}

${c.red}Force Delete & Recreate Module               Example Usage${c.reset}
   ${c.yellow}npm run agmcr  -- --profile${c.reset}            ${c.cyan}npm run ags -- --giftcard-processor${c.reset}
   ${c.yellow}npm run agmsr  -- --notification${c.reset}

${c.green}${c.bold}Naming Rules:${c.reset} lowercase • letters • numbers • hyphens only • no underscores
${c.dim}   Good → auth-login • payment-gateway • user-profile • card-v2 • admin-tools
   Bad  → User • auth_login • CardService • 123test${c.reset}

${c.green}${c.bold}
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║        Official Developer Portal: ${c.cyan}${c.underline}https://developer.afrogift.com.ng${c.reset}${c.green}       ║
║                                                                                  ║
║              Afro Gift Team — We don’t just build systems.                   ║
║                    We ignite revolutions. Fire Fire Fire                ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝${c.reset}

${c.green}${c.italic}100% Cross-Platform • Windows • macOS • Linux • Built with Pure Naija Fire${c.reset}
  `);
  process.exit(0);
}

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.log(`\n${c.red}${c.bold}Invalid name: "${name}"${c.reset}`);
  console.log(`${c.yellow}Rule: lowercase • letters • numbers • hyphens only${c.reset}`);
  console.log(`${c.dim}Good: card, authLogin, userProfile\nBad : card-profile, user_profile, 123start${c.reset}\n`);
  process.exit(1);
}

const pretty = name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

const isService = npmScriptName.includes('agms');
const isForce = npmScriptName.includes('agmsr') || npmScriptName.includes('agmcr');

const targetPath = isService
  ? path.join('src', 'app', 'shared', 'services', name)
  : path.join('src', 'app', name);

const exists = fs.existsSync(targetPath);

if (exists && !isForce) {
  console.log(`\n${c.red}Folder already exists:${c.reset}`);
  console.log(`${c.bold}   📂 ${targetPath}${c.reset}\n`);
  console.log(`${c.yellow}${c.bold}Want to overwrite? Use force mode:${c.reset}`);
  console.log(`   ${c.red}→${c.reset} npm run ${isService ? 'agmsr' : 'agmcr'} -- --${name}\n`);
  process.exit(1);
}

if (isForce && exists) {
  console.log(`${c.yellow}${c.bold}Deleting existing folder...${c.reset}`);
  try {
    const cmd = process.platform === 'win32'
      ? `rmdir /s /q "${targetPath}"`
      : `rm -rf "${targetPath}"`;
    execSync(cmd, { stdio: 'ignore' });
    console.log(`${c.green}Deleted successfully! Folder removed.${c.reset}\n`);
  } catch (e) {
    console.log(`${c.red}Failed to delete folder.${c.reset} Remove manually and retry.`);
    process.exit(1);
  }
}

console.log(`${c.cyan}${c.bold}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   Generating "${c.green}${pretty}${c.cyan}" → ${isService ? 'Service' : 'Feature Module'}               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}\n`);

try {
  if (isService) {
    const cmd = `ng g s shared/services/${name}/${name}`;
    console.log(`  ${c.purple}Service →${c.reset} ${c.cyan}${cmd}${c.reset}`);
    execSync(cmd, { stdio: 'inherit' });
  } else {
    const cmds = [
      `ng g m ${name} --routing`,
      `ng g c ${name}/index --module=${name}`,
      `ng g c ${name}/new --module=${name}`,
      `ng g c ${name}/view --module=${name}`
    ];
    cmds.forEach((cmd, i) => {
      console.log(`  ${c.dim}[${i + 1}/4]${c.reset} ${c.purple}Running →${c.reset} ${c.cyan}${cmd}${c.reset}`);
      execSync(cmd, { stdio: 'inherit' });
    });
  }

  console.log(`\n${c.green}${c.bold}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     SUCCESS! "${pretty}" ${isService ? 'Service' : 'Feature Module'} Generated!     ║
║                                                                              ║
║          Afro Gift Team — We move different. Fire Fire Fire             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}\n`);

} catch (err) {
  console.log(`\n${c.red}${c.bold}Generation failed!${c.reset}`);
  console.log(`${c.yellow}Make sure Angular CLI is installed globally:${c.reset}`);
  console.log(`${c.cyan}   npm install -g @angular/cli${c.reset}\n`);
  process.exit(1);
}
