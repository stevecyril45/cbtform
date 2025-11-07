const { exec } = require('child_process');
const os = require('os'); // For platform check

// Optional: Check if on Windows
if (os.platform() !== 'win32') {
  console.error('This script uses ipconfig, which is Windows-only.');
  process.exit(1);
}

// Run ipconfig and capture output
exec('ipconfig', { encoding: 'utf8' }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing ipconfig: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`ipconfig stderr: ${stderr}`);
    return;
  }

  // Parse stdout for IPv4 Address
  const lines = stdout.split('\n');
  let ipAddress = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('IPv4 Address') || line.includes('IPv4-Adresse')) { // Handles some locales
      // Extract IP after the colon (e.g., "192.168.1.100")
      ipAddress = line.split(':')[1]?.trim();
      if (ipAddress && ipAddress.includes('.')) { // Basic IPv4 check
        break;
      }
    }
  }

  if (ipAddress) {
    console.log(`Your local IPv4 address: ${ipAddress}`);
  } else {
    console.log('No IPv4 address found in ipconfig output.');
  }
});