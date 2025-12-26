const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/patients/stats/dashboard',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('API Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      console.log('\n✅ Parsed successfully');
    } catch (e) {
      console.log('Raw response:');
      console.log(data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  process.exit(1);
});

req.end();
