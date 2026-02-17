// Verify which Amazon image URLs are actually accessible
const https = require('https');
const fs = require('fs');

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const missing = products.filter(p => p.image && p.image.includes('unsplash'));

// For each ASIN, try the standard Amazon image URL pattern
// Amazon uses format: https://images-na.ssl-images-amazon.com/images/I/ASIN._AC_SL1500_.jpg
// But the image ID != ASIN. So we need to search.

// Alternative: use Google Shopping image search via web
async function checkUrl(url) {
    return new Promise(resolve => {
        const req = https.get(url, res => {
            resolve(res.statusCode === 200);
            res.resume();
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => { req.destroy(); resolve(false); });
    });
}

// Use high-quality tech product images from Unsplash with specific search terms
const categoryImages = {
    gaming: [
        'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&h=400&fit=crop', // gaming setup
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop', // keyboard
    ],
    'ai-ml': [
        'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400&h=400&fit=crop', // circuit
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop', // tech
    ],
    'tech-nerd': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop', // raspberry pi
        'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400&h=400&fit=crop', // 3d printer
    ],
    student: [
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop', // desk setup
    ],
    creative: [
        'https://images.unsplash.com/photo-1561883088-039e53143d73?w=400&h=400&fit=crop', // drawing tablet
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop', // monitor
    ],
    'home-office': [
        'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop', // desk
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', // headphones
    ]
};

// Better approach: use specific Unsplash photos that match each product
const specificImages = {
    'B0CV3G8Z5G': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop', // gaming laptop
    'B0CG26N8TG': 'https://images.unsplash.com/photo-1601737487795-dab272f52420?w=400&h=400&fit=crop', // NAS
    'B0BZ4SCGLF': 'https://images.unsplash.com/photo-1601737487795-dab272f52420?w=400&h=400&fit=crop', // NAS
    'B0BY5VT6DP': 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&h=400&fit=crop', // cooler
    'B0CLBL5JJR': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop', // dev kit
    'B0CTH7MKWH': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop', // Pi
    'B0CSD2TLJK': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop', // Pi
    'B0C65CXKRP': 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400&h=400&fit=crop', // 3D printer
    'B0C5RFHBJK': 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400&h=400&fit=crop', // 3D printer
    'B0BQBYZL1Y': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=400&fit=crop', // smart plug
    'B0D8M7P2ZN': 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400&h=400&fit=crop', // drone
    'B0BL3GZWWT': 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400&h=400&fit=crop', // drone
    'B08GV3Y52S': 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=400&fit=crop', // SSD
    'B07YC5YDYG': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop', // laptop stand
    'B0BSGH4L1N': 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop', // USB hub
    'B0BT4NZC45': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop', // mouse
    'B0B4NSMQGT': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop', // stand
    'B07ZPV7RDM': 'https://images.unsplash.com/photo-1561883088-039e53143d73?w=400&h=400&fit=crop', // drawing display
    'B08LLBH1F5': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop', // monitor
    'B08LCMJGBF': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop', // monitor
    'B0BXH2N7K7': 'https://images.unsplash.com/photo-1561883088-039e53143d73?w=400&h=400&fit=crop', // pen display
    'B0BSLS8PQR': 'https://images.unsplash.com/photo-1561883088-039e53143d73?w=400&h=400&fit=crop', // pen display
    'B08N583DVN': 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop', // standing desk
    'B0B3LMQVTF': 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop', // standing desk
    'B0BVG3N8NR': 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop', // office chair
    'B0BQ3NWLR3': 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop', // office chair
    'B0BX2L8PBT': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', // headphones
    'B09WDBM93J': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', // headphones
    'B09BGT2GBL': 'https://images.unsplash.com/photo-1558470598-a5dda9640f68?w=400&h=400&fit=crop', // LED light bars
};

// These are still Unsplash but at least more product-specific
// The real fix needs Browser Relay or Amazon API
let updated = 0;
for (const p of missing) {
    const url = specificImages[p.asin];
    if (url && url !== p.image) {
        const idx = products.findIndex(x => x.asin === p.asin);
        products[idx].image = url;
        updated++;
        console.log(`✓ ${p.asin}: Updated with better matching image`);
    }
}
fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2));
console.log(`Updated ${updated}/${missing.length} with better Unsplash matches`);
