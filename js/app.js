/* ========== TechGear App — Animated Edition ========== */

let allProducts = [];
let currentCategory = 'all';
let searchQuery = '';

const categoryNames = {
    all: 'All Products',
    gaming: '🎮 Gaming',
    ai: '🤖 AI / ML',
    coding: '💻 Coding',
    peripherals: '🎧 Peripherals',
    networking: '🌐 Networking'
};

// Short links cleared — using constructed links with real ASINs (Feb 16, 2026)
const shortLinks = {};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initScrollEffects();
    initCounters();

    fetch('./data/products.json')
        .then(r => r.json())
        .then(data => {
            allProducts = data;
            updateCategoryCounts();
            renderProducts();
        })
        .catch(err => {
            console.error('Failed to load products:', err);
            document.getElementById('product-grid').innerHTML =
                '<div class="no-results"><div class="no-results-icon">🔌</div>Failed to load products.<br>Run a local server (npx serve) to load the JSON.</div>';
        });

    document.getElementById('search').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderProducts();
    });
});

// ==================== PARTICLES ====================
function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000 };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Create particles
    const count = Math.min(60, Math.floor(window.innerWidth / 25));
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.3 + 0.05,
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, i) => {
            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Wrap
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Mouse repel
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                p.x += (dx / dist) * force * 2;
                p.y += (dy / dist) * force * 2;
            }

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 214, 50, ${p.opacity})`;
            ctx.fill();

            // Draw connections
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                if (d < 140) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 214, 50, ${0.06 * (1 - d / 140)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// ==================== SCROLL EFFECTS ====================
function initScrollEffects() {
    const navbar = document.getElementById('navbar');

    // Navbar background on scroll
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Reveal on scroll (IntersectionObserver)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger delay for cat-cards
                const delay = entry.target.style.getPropertyValue('--i');
                if (delay !== '') {
                    entry.target.style.transitionDelay = `${delay * 0.1}s`;
                }
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==================== COUNTER ANIMATION ====================
function initCounters() {
    const counters = document.querySelectorAll('.stat-num[data-count]');
    counters.forEach(el => {
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = Math.max(1, Math.floor(target / 30));
        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current;
        }, 40);
    });
}

// ==================== CATEGORY COUNTS ====================
function updateCategoryCounts() {
    document.querySelectorAll('.cat-count').forEach(el => {
        const cat = el.dataset.cat;
        const count = allProducts.filter(p => p.category === cat).length;
        el.textContent = `${count} items`;
    });
}

// ==================== FILTER ====================
function filterCategory(cat, linkEl) {
    currentCategory = cat;
    searchQuery = '';
    document.getElementById('search').value = '';

    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (linkEl) {
        linkEl.classList.add('active');
    } else {
        document.querySelectorAll('.nav-link').forEach(l => {
            if (l.dataset.category === cat) l.classList.add('active');
        });
    }

    // Toggle hero/categories visibility
    const hero = document.getElementById('hero');
    const catSection = document.getElementById('categories-section');
    if (cat !== 'all') {
        hero.style.display = 'none';
        catSection.style.display = 'none';
    } else {
        hero.style.display = '';
        catSection.style.display = '';
    }

    renderProducts();

    if (cat !== 'all') {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showAll() {
    filterCategory('all');
}

// ==================== RENDER ====================
function renderProducts() {
    const grid = document.getElementById('product-grid');
    const title = document.getElementById('section-title');
    const count = document.getElementById('product-count');

    let filtered = allProducts;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery) ||
            p.category.toLowerCase().includes(searchQuery)
        );
    }

    // Sort: top picks first
    filtered.sort((a, b) => (b.topPick ? 1 : 0) - (a.topPick ? 1 : 0));

    title.textContent = searchQuery
        ? `Results for "${searchQuery}"`
        : (categoryNames[currentCategory] || 'All Products');

    count.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div>No products found.<br>Try a different search or category.</div>';
        return;
    }

    grid.innerHTML = filtered.map((product, idx) => {
        const fullStars = Math.floor(product.rating);
        const hasHalf = product.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '<span class="star">★</span>';
        if (hasHalf) starsHtml += '<span class="star half">★</span>';
        for (let i = 0; i < emptyStars; i++) starsHtml += '<span class="star empty">★</span>';

        const affiliateUrl = shortLinks[product.asin] || `https://www.amazon.com/dp/${product.asin}?tag=grubsight-20`;
        const badge = product.topPick ? '<span class="product-badge">⚡ Top Pick</span>' : '';
        const catLabel = categoryNames[product.category]?.replace(/^..\s/, '') || product.category;

        return `
            <div class="product-card" style="animation-delay: ${idx * 0.05}s">
                ${badge}
                <div class="product-img-wrapper">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-category-tag">${catLabel}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-meta">
                        <span class="product-price">${product.price}</span>
                        <span class="product-rating">${starsHtml}</span>
                    </div>
                    <a href="${affiliateUrl}" target="_blank" rel="noopener noreferrer" class="buy-btn">
                        Buy on Amazon
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}
