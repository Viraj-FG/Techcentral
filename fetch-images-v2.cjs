// Use web search to find Amazon product images
const fs = require('fs');
const https = require('https');

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const needImages = products.filter(p => !p.image || p.image === '');
console.log(`Need images for ${needImages.length} products`);

// For products without images, try the standard Amazon image URL pattern
// Amazon images follow: https://m.media-amazon.com/images/I/IMAGEID._AC_SL1500_.jpg
// We can try fetching via a different path

let found = 0;

function tryImage(asin) {
    return new Promise((resolve) => {
        // Try fetching the product page via a simpler endpoint
        const opts = {
            hostname: 'www.amazon.com',
            path: `/gp/product/${asin}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html',
            }
        };
        
        const req = https.get(opts, (res) => {
            let data = '';
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                const loc = res.headers.location;
                const u = new URL(loc.startsWith('/') ? `https://www.amazon.com${loc}` : loc);
                https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: opts.headers }, (res2) => {
                    let d2 = '';
                    res2.on('data', c => d2 += c);
                    res2.on('end', () => { parseAndResolve(asin, d2, resolve); });
                }).on('error', () => resolve(null));
                return;
            }
            res.on('data', c => data += c);
            res.on('end', () => { parseAndResolve(asin, data, resolve); });
        });
        req.on('error', () => resolve(null));
        req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    });
}

function parseAndResolve(asin, data, resolve) {
    // Multiple regex patterns
    const patterns = [
        /"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /"large"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /data-old-hires="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /property="og:image"\s+content="(https:\/\/[^"]+)"/,
        /"mainUrl"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
        /src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\._AC_[^"]+)"/,
    ];
    
    for (const pat of patterns) {
        const m = data.match(pat);
        if (m && m[1]) {
            found++;
            process.stdout.write(`\rFound: ${found}/${needImages.length}`);
            resolve(m[1]);
            return;
        }
    }
    resolve(null);
}

async function run() {
    const BATCH = 3;
    const results = {};
    
    for (let i = 0; i < needImages.length; i += BATCH) {
        const batch = needImages.slice(i, i + BATCH);
        const imgs = await Promise.all(batch.map(p => tryImage(p.asin)));
        batch.forEach((p, idx) => {
            if (imgs[idx]) results[p.asin] = imgs[idx];
        });
        await new Promise(r => setTimeout(r, 3000)); // longer delay
    }
    
    console.log(`\nTotal found: ${Object.keys(results).length}`);
    
    // Update
    let updated = 0;
    for (const p of products) {
        if (results[p.asin]) { p.image = results[p.asin]; updated++; }
    }
    fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2));
    console.log(`Updated ${updated} products`);
    
    const still = products.filter(p => !p.image || p.image === '');
    console.log(`Still missing: ${still.length}`);
    if (still.length > 0) {
        // For truly missing ones, use a placeholder based on category
        const placeholders = {
            'gaming': 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop',
            'coding': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
            'streaming': 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&h=400&fit=crop',
            'ai-ml': 'https://images.unsplash.com/photo-1591238372338-21a4e3bd2a26?w=400&h=400&fit=crop',
            'tech-nerd': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop',
            'student': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
            'creative': 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=400&h=400&fit=crop',
            'home-office': 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&h=400&fit=crop',
        };
        for (const p of still) {
            p.image = placeholders[p.category] || placeholders['gaming'];
        }
        fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2));
        console.log(`Applied ${still.length} placeholder images`);
    }
}
run();
