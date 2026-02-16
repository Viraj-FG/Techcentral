const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

const configPath = path.join(os.homedir(), '.wrangler', 'config', 'default.toml');
const config = fs.readFileSync(configPath, 'utf8');
const tokenMatch = config.match(/oauth_token\s*=\s*"([^"]+)"/);
const token = tokenMatch[1];
const accountId = '24c5b14aa2682075334c8be529c6ea9f';

const action = process.argv[2] || 'list-zones';

function cfGet(apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: apiPath,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}

function cfPost(apiPath, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'api.cloudflare.com',
      path: apiPath,
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': body.length }
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (chunk) => d += chunk);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  if (action === 'list-zones') {
    const r = await cfGet(`/client/v4/zones?account.id=${accountId}`);
    console.log(JSON.stringify(r.result?.map(z => ({name: z.name, id: z.id, status: z.status})), null, 2));
  } else if (action === 'add-zone') {
    const r = await cfPost('/client/v4/zones', { account: { id: accountId }, name: 'kaeva.app', type: 'full' });
    console.log(JSON.stringify(r, null, 2));
  } else if (action === 'add-domain') {
    const r = await cfPost(`/client/v4/accounts/${accountId}/pages/projects/kaeva/domains`, { hostname: 'kaeva.app' });
    console.log(JSON.stringify(r, null, 2));
  }
})();
