// Fetch real Amazon product images for remaining unsplash placeholders
const fs = require('fs');
const https = require('https');

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const missing = products.filter(p => p.image && p.image.includes('unsplash'));

console.log(`Found ${missing.length} products with placeholder images`);

// Try Amazon's image URL pattern: https://m.media-amazon.com/images/I/[imageId]._AC_SL1500_.jpg
// We can try fetching the product page to find the real image

async function fetchImage(asin) {
    return new Promise((resolve) => {
        const url = `https://www.amazon.com/dp/${asin}`;
        const options = {
            hostname: 'www.amazon.com',
            path: `/dp/${asin}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        };

        const req = https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Try to extract hiRes image
                const hiResMatch = data.match(/"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
                if (hiResMatch) {
                    resolve(hiResMatch[1]);
                    return;
                }
                // Try landingImage
                const landingMatch = data.match(/id="landingImage"[^>]*src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
                if (landingMatch) {
                    resolve(landingMatch[1]);
                    return;
                }
                // Try any Amazon image
                const anyMatch = data.match(/(https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+_.-]+\._AC_SL\d+_\.jpg)/);
                if (anyMatch) {
                    resolve(anyMatch[1]);
                    return;
                }
                resolve(null);
            });
        });
        req.on('error', () => resolve(null));
        req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    });
}

async function main() {
    let updated = 0;
    for (let i = 0; i < missing.length; i++) {
        const p = missing[i];
        console.log(`[${i+1}/${missing.length}] ${p.asin}: ${p.name.substring(0, 50)}...`);
        const img = await fetchImage(p.asin);
        if (img) {
            const idx = products.findIndex(x => x.asin === p.asin);
            products[idx].image = img;
            updated++;
            console.log(`  ✓ Found image`);
        } else {
            console.log(`  ✗ No image found`);
        }
        // Small delay to avoid throttling
        await new Promise(r => setTimeout(r, 1500));
    }
    
    fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2));
    console.log(`\nDone: ${updated}/${missing.length} images updated`);
}

main();
