const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

const configPath = path.join(os.homedir(), '.wrangler', 'config', 'default.toml');
const config = fs.readFileSync(configPath, 'utf8');
const tokenMatch = config.match(/oauth_token\s*=\s*"([^"]+)"/);
const token = tokenMatch[1];

const zoneId = '2120e5dc28442063a8fc432068dc7681';
const action = process.argv[2];

function cfReq(method, apiPath, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.cloudflare.com',
      path: apiPath,
      method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (chunk) => d += chunk);
      res.on('end', () => { console.log(d); });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  if (action === 'list-dns') {
    await cfReq('GET', `/client/v4/zones/${zoneId}/dns_records?per_page=50`);
  } else if (action === 'add-cname') {
    await cfReq('POST', `/client/v4/zones/${zoneId}/dns_records`, {
      type: 'CNAME', name: '@', content: 'kaeva.pages.dev', proxied: true, ttl: 1
    });
  } else if (action === 'delete-dns') {
    await cfReq('DELETE', `/client/v4/zones/${zoneId}/dns_records/${process.argv[3]}`);
  }
})();
