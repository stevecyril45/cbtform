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
  bgPurple: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgYellow: '\x1b[43m',
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
${c.bgPurple}${c.bold}                                                                                 ${c.reset}
${c.bgPurple}${c.bold}    █████╗  ██████╗  ██████╗██╗     ██╗         ${c.bgCyan}${c.bold} Afro Gift CLI v2.0 ${c.reset}${c.bgPurple}     ${c.reset}
${c.bgPurple}${c.bold}   ██╔══██╗██╔════╝ ██╔════╝██║     ██║            ${c.cyan}Command Line Interface${c.reset}${c.bgPurple}     ${c.reset}
${c.bgPurple}${c.bold}   ███████║██║  ███╗██║     ██║     ██║         ${c.purple}Powered by Fire & Precision${c.reset}${c.bgPurple}     ${c.reset}
${c.bgPurple}${c.bold}   ██╔══██║██║   ██║██║     ██║     ██║                                      ${c.reset}
${c.bgPurple}${c.bold}   ██║  ██║╚██████╔╝╚██████╔╝███████╗███████╗                                ${c.reset}
${c.bgPurple}${c.bold}   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝                                ${c.reset}
${c.reset}

${c.bold}${c.pink}╔══════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.bold}${c.pink}║                          ${c.cyan}AGC Li — Afro Gift CLI${c.pink}                            ║${c.reset}
${c.bold}${c.pink}╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}

${c.green}Checkmark Generate Feature Module:${c.reset}          ${c.yellow}npm run agmc -- --user${c.reset}
${c.green}Checkmark Generate Service:${c.reset}                 ${c.yellow}npm run agms -- --card${c.reset}
${c.red}Fire Force Delete & Regenerate Module:${c.reset}   ${c.yellow}npm run agmcr -- --user${c.reset}
${c.red}Fire Force Delete & Regenerate Service:${c.reset}  ${c.yellow}npm run agmsr -- --card${c.reset}

${c.dim}   Example: ${c.cyan}npm run agmc -- --payment-gateway${c.reset}

${c.orange}${c.italic}Sparkles NOW 100% COMPATIBLE WITH WINDOWS, MAC & LINUX Sparkles${c.reset}

${c.purple}${c.bold}   Afro Gift Team — We don't just code. We ignite. Fire Fire Fire${c.reset}
  `);
  process.exit(0);
}

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.log(`\n${c.red}${c.bold}Invalid name: "${name}"${c.reset}`);
  console.log(`${c.yellow}Rule: lowercase • letters • numbers • hyphens only${c.reset}`);
  console.log(`${c.dim}Good: card, auth-login, user-profile\nBad : Card, user_profile, 123start${c.reset}\n`);
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
      console.log(`  ${c.dim}[${i+1}/4]${c.reset} ${c.purple}Running →${c.reset} ${c.cyan}${cmd}${c.reset}`);
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
