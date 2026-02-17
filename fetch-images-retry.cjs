const fs = require('fs');
const https = require('https');

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const needImages = products.filter(p => !p.image || p.image === '');
const asins = [...new Set(needImages.map(p => p.asin))];
console.log(`Retrying ${asins.length} ASINs without images`);

const imageMap = {};
let completed = 0, failed = 0;

const UAs = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

function fetchPage(asin, attempt) {
    return new Promise((resolve) => {
        const ua = UAs[attempt % UAs.length];
        const opts = {
            hostname: 'www.amazon.com',
            path: `/dp/${asin}`,
            headers: {
                'User-Agent': ua,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
            }
        };
        https.get(opts, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Follow redirect
                const loc = res.headers.location;
                if (loc) {
                    try {
                        const u = new URL(loc.startsWith('/') ? `https://www.amazon.com${loc}` : loc);
                        https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: opts.headers }, (res2) => {
                            let data = '';
                            res2.on('data', c => data += c);
                            res2.on('end', () => {
                                extractImage(asin, data);
                                resolve();
                            });
                        }).on('error', () => { failed++; resolve(); });
                    } catch(e) { failed++; resolve(); }
                } else { failed++; resolve(); }
                return;
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                extractImage(asin, data);
                resolve();
            });
        }).on('error', () => { failed++; resolve(); });
    });
}

function extractImage(asin, data) {
    let match = data.match(/"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (!match) match = data.match(/"large"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (!match) match = data.match(/"mainUrl"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (!match) match = data.match(/property="og:image"\s+content="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (!match) match = data.match(/data-old-hires="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (!match) match = data.match(/"https:\/\/m\.media-amazon\.com\/images\/I\/([\w\-\.]+\._[^"]*)"/) && 
        [null, `https://m.media-amazon.com/images/I/${RegExp.$1}`];
    if (match && match[1]) {
        imageMap[asin] = match[1];
        completed++;
    } else {
        failed++;
    }
    process.stdout.write(`\r${completed} found, ${failed} failed, ${completed + failed}/${asins.length}`);
}

async function run() {
    // Try 3 attempts with different UAs and delays
    for (let attempt = 0; attempt < 3; attempt++) {
        const remaining = asins.filter(a => !imageMap[a]);
        if (remaining.length === 0) break;
        console.log(`\nAttempt ${attempt + 1}: ${remaining.length} remaining`);
        completed = 0; failed = 0;
        
        const BATCH = 5;
        for (let i = 0; i < remaining.length; i += BATCH) {
            const batch = remaining.slice(i, i + BATCH);
            await Promise.all(batch.map(a => fetchPage(a, attempt)));
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    
    const totalFound = Object.keys(imageMap).length;
    console.log(`\nTotal found: ${totalFound}/${asins.length}`);
    
    // Update products.json
    let updated = 0;
    for (const p of products) {
        if (imageMap[p.asin]) {
            p.image = imageMap[p.asin];
            updated++;
        }
    }
    fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2));
    console.log(`Updated ${updated} products`);
    
    // List still missing
    const stillMissing = products.filter(p => !p.image || p.image === '');
    if (stillMissing.length > 0) {
        console.log(`\nStill missing (${stillMissing.length}):`);
        stillMissing.forEach(p => console.log(`  ${p.asin} - ${p.name}`));
    }
}
run();
