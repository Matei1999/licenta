// Start server and test after delay
const { spawn } = require('child_process');
const path = require('path');

// Start server
const server = spawn('node', ['server.js'], {
  cwd: path.join(__dirname),
  stdio: ['inherit', 'pipe', 'pipe']
});

// Wait for server to start
setTimeout(async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/patients/stats/dashboard');
    const data = await response.json();
    console.log('\n📊 API RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    server.kill();
  }
}, 3000);
