const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

const configPath = path.join(os.homedir(), '.wrangler', 'config', 'default.toml');
const config = fs.readFileSync(configPath, 'utf8');
const tokenMatch = config.match(/oauth_token\s*=\s*"([^"]+)"/);
if (!tokenMatch) { console.log('No token found'); process.exit(1); }
const token = tokenMatch[1];

const accountId = '24c5b14aa2682075334c8be529c6ea9f';
const projectName = 'kaeva';
const data = JSON.stringify({hostname: 'kaeva.app'});

const options = {
  hostname: 'api.cloudflare.com',
  path: `/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const j = JSON.parse(body);
      console.log(JSON.stringify(j, null, 2));
    } catch(e) {
      console.log(body);
    }
  });
});
req.on('error', (e) => console.error(e));
req.write(data);
req.end();
