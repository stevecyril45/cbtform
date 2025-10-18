const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Ensure dist exists (run initial build if needed)
const distPath = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log('dist folder missing—running initial build...');
  const { execSync } = require('child_process');
  try {
    execSync('npm run build', { stdio: 'inherit', shell: true });
    console.log('Initial build complete.');
  } catch (err) {
    console.error('Initial build failed:', err.message);
    process.exit(1);
  }
}

const platform = os.platform();

// Function to open a terminal and run a command
function openTerminal(command, label) {
  let openCmd;
  if (platform === 'darwin') { // macOS
    // Use AppleScript to open Terminal and run command
    openCmd = `osascript -e 'tell application "Terminal" to do script "${command}"'`;
  } else if (platform === 'win32') { // Windows
    // Use start cmd to open new Command Prompt
    openCmd = `start "title: ${label}" cmd /k "${command}"`;
  } else { // Linux (assumes gnome-terminal; fallback to xterm)
    const terminal = fs.existsSync('/usr/bin/gnome-terminal') ? 'gnome-terminal' : 'xterm';
    openCmd = `${terminal} -e bash -c "${command}; exec bash"`;
  }

  exec(openCmd, (error) => {
    if (error) {
      console.error(`Failed to open terminal for ${label}:`, error.message);
      console.log(`Fallback: Run manually in a new terminal: ${command}`);
    } else {
      console.log(`${label} terminal opened!`);
    }
  });
}

// Commands to run
const watchCmd = 'npm run watch';
const serverCmd = `cd "${distPath}" && npm run start`;

// Open terminals
openTerminal(watchCmd, 'Angular Watch');
openTerminal(serverCmd, 'Dist Server');

console.log('Terminals opened! Dev setup running in separate windows.');
console.log('Edit Angular files to trigger rebuilds. Server on http://localhost:5000');
console.log('Close the terminals to stop processes.');

// Parent script exits immediately after launching
setTimeout(() => process.exit(0), 2000);