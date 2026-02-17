/* ========== KAEVA TechCentral — Full Interactive App ========== */

let allProducts = [];
let currentCategory = 'all';
let searchQuery = '';
let currentView = 'grid';
let compareList = []; // max 3
let setupBag = []; // asin list
let heroWords = ['Build.', 'Create.', 'Dominate.', 'Win.'];
let heroWordIdx = 0;

const AFFILIATE_TAG = 'grubsight-20';

const categoryNames = {
    all: 'All Products',
    gaming: '🎮 Gaming',
    ai: '🤖 AI / ML',
    coding: '💻 Coding',
    peripherals: '🎧 Peripherals',
    networking: '🌐 Networking'
};

function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function affiliateUrl(asin) {
    return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

function parsePrice(p) {
    return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    // Load hero video lazily
    const heroVid = document.getElementById('hero-video-bg');
    if (heroVid) { heroVid.src = 'assets/hero-bg.mp4'; }

    initCustomCursor();
    initLetterSplit();
    initMagneticButtons();
    initScrollProgress();
    initHeroParallax();
    initParticles();
    initParallax();
    initHeroMouseFollow();
    initHeroTyper();
    initScrollReveal();
    initCounters();
    initMobileMenu();
    initViewToggle();
    initBackToTop();
    initKeyboardShortcuts();
    init3DTilt();
    initNavbarScroll();

    // Load setup bag from localStorage
    try {
        const saved = localStorage.getItem('kaeva-setup');
        if (saved) setupBag = JSON.parse(saved);
        updateSetupCount();
    } catch(e) {}

    fetch('./data/products.json')
        .then(r => r.json())
        .then(data => {
            allProducts = data;
            updateCategoryCounts();
            renderFeatured();
            renderProducts();
            renderMarquee();
            initStaggerReveal();
        })
        .catch(err => {
            console.error('Failed to load products:', err);
            document.getElementById('product-grid').innerHTML =
                '<div class="no-results"><div class="no-results-icon">🔌</div>Failed to load products.</div>';
        });

    document.getElementById('search').addEventListener('input', debounce((e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderProducts();
        renderSearchPreview();
    }, 200));

    document.getElementById('search').addEventListener('focus', () => {
        if (searchQuery) renderSearchPreview();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('search-preview').classList.remove('active');
        }
    });
});

// ==================== PARTICLES ====================
function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let animId;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 10 : Math.min(40, Math.floor(window.innerWidth / 40));
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.15 + 0.03,
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                p.x += (dx / dist) * force * 1.5;
                p.y += (dy / dist) * force * 1.5;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            const colors = ['108, 92, 231', '0, 206, 201', '162, 155, 254'];
            ctx.fillStyle = `rgba(${colors[i % 3]}, ${p.opacity})`;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                if (d < 130) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(108, 92, 231, ${0.04 * (1 - d / 130)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
        animId = requestAnimationFrame(animate);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(animId);
        else animate();
    });
    animate();
}

// ==================== PARALLAX SCROLLING ====================
function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer[data-speed]');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                layers.forEach(layer => {
                    const speed = parseFloat(layer.dataset.speed);
                    layer.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
                });
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ==================== HERO MOUSE FOLLOW ====================
function initHeroMouseFollow() {
    const hero = document.getElementById('hero');
    const follow = document.getElementById('hero-mouse-follow');
    if (!hero || !follow) return;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        follow.style.left = (e.clientX - rect.left) + 'px';
        follow.style.top = (e.clientY - rect.top) + 'px';
    });
}

// ==================== HERO TYPED TEXT ====================
function initHeroTyper() {
    const el = document.getElementById('hero-typed');
    if (!el) return;

    setInterval(() => {
        heroWordIdx = (heroWordIdx + 1) % heroWords.length;
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        setTimeout(() => {
            el.textContent = heroWords[heroWordIdx];
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 300);
    }, 3000);

    el.style.transition = 'opacity 0.3s, transform 0.3s';
}

// ==================== SCROLL REVEAL ====================
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.section-reveal').forEach(el => observer.observe(el));
}

// ==================== NAVBAR SCROLL ====================
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
}

// ==================== ANIMATED COUNTERS ====================
function initCounters() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(el => observer.observe(el));
}

function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + (progress >= 1 ? suffix : '');
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ==================== 3D TILT EFFECT ====================
function init3DTilt() {
    if (window.innerWidth < 768) return;

    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('[data-tilt]').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top > window.innerHeight || rect.bottom < 0) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x < -20 || x > rect.width + 20 || y < -20 || y > rect.height + 20) {
                el.style.transform = '';
                return;
            }

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -4;
            const rotateY = ((x - centerX) / centerX) * 4;

            el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
        });
    });

    document.addEventListener('mouseleave', () => {
        document.querySelectorAll('[data-tilt]').forEach(el => {
            el.style.transform = '';
        });
    });
}

// ==================== MOBILE MENU ====================
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const catBar = document.getElementById('category-bar');
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        catBar.classList.toggle('open');
    });
}

// ==================== VIEW TOGGLE ====================
function initViewToggle() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            document.getElementById('product-grid').classList.toggle('list-view', currentView === 'list');
        });
    });
}

// ==================== BACK TO TOP ====================
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            const active = document.activeElement;
            if (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
                e.preventDefault();
                document.getElementById('search').focus();
            }
        }
        if (e.key === 'Escape') {
            closeQuickView();
            closeCompareModal();
            closeExperienceModal();
            document.getElementById('search').blur();
            document.getElementById('search-preview').classList.remove('active');
        }
    });
}

// ==================== SEARCH PREVIEW ====================
function renderSearchPreview() {
    const preview = document.getElementById('search-preview');
    if (!searchQuery) {
        preview.classList.remove('active');
        return;
    }

    const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery)
    ).slice(0, 5);

    if (results.length === 0) {
        preview.classList.remove('active');
        return;
    }

    preview.innerHTML = results.map(p => `
        <div class="search-preview-item" onclick="openQuickView('${p.asin}')">
            <img src="${p.imageUrl}" alt="${p.name}" loading="lazy">
            <div class="search-preview-info">
                <h4>${p.name}</h4>
                <span>${p.price}</span>
            </div>
        </div>
    `).join('');
    preview.classList.add('active');
}

// ==================== CATEGORY COUNTS ====================
function updateCategoryCounts() {
    document.querySelectorAll('.cat-count').forEach(el => {
        const cat = el.dataset.cat;
        el.textContent = `${allProducts.filter(p => p.category === cat).length} items`;
    });
}

// ==================== STARS ====================
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let html = '';
    for (let i = 0; i < full; i++) html += '<span class="star">★</span>';
    if (half) html += '<span class="star half">★</span>';
    for (let i = 0; i < empty; i++) html += '<span class="star empty">★</span>';
    return html;
}

// ==================== FEATURED ====================
function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    const topPicks = allProducts.filter(p => p.topPick).slice(0, 6);

    grid.innerHTML = topPicks.map((product, idx) => {
        const catLabel = categoryNames[product.category]?.replace(/^..\s/, '') || product.category;
        return `
            <div class="featured-card" style="animation-delay: ${idx * 0.08}s" onclick="openQuickView('${product.asin}')" data-tilt>
                <span class="product-badge">⚡ Top Pick</span>
                <div class="featured-img">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="featured-info">
                    <span class="featured-cat">${catLabel}</span>
                    <h3 class="featured-name">${product.name}</h3>
                    <p class="featured-desc">${product.description}</p>
                    <div class="featured-bottom">
                        <span class="featured-price">${product.price}</span>
                        <a href="${affiliateUrl(product.asin)}" target="_blank" rel="noopener noreferrer" class="featured-buy" onclick="event.stopPropagation()">
                            Buy <span class="prime-badge">Prime</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== FILTER ====================
function filterCategory(cat, linkEl) {
    currentCategory = cat;
    searchQuery = '';
    document.getElementById('search').value = '';
    document.getElementById('search-preview').classList.remove('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (linkEl) {
        linkEl.classList.add('active');
    } else {
        document.querySelectorAll('.nav-link').forEach(l => {
            if (l.dataset.category === cat) l.classList.add('active');
        });
    }

    const sections = ['hero', 'categories-section', 'experiences', 'editorial'];
    const hideable = ['.featured-section', '.trust-section', '.experiences-section', '.editorial-section'];

    if (cat !== 'all') {
        document.getElementById('hero').style.display = 'none';
        document.getElementById('categories-section').style.display = 'none';
        hideable.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.style.display = 'none';
        });
    } else {
        document.getElementById('hero').style.display = '';
        document.getElementById('categories-section').style.display = '';
        hideable.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.style.display = '';
        });
    }

    renderProducts();
    if (cat !== 'all') {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.filterCategory = filterCategory;

function showAll() {
    filterCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.showAll = showAll;

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.scrollToSection = scrollToSection;

// ==================== RENDER PRODUCTS ====================
function renderProducts() {
    const grid = document.getElementById('product-grid');
    const title = document.getElementById('section-title');
    const count = document.getElementById('product-count');

    let filtered = allProducts;
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
    if (searchQuery) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery) ||
            p.category.toLowerCase().includes(searchQuery)
        );
    }
    filtered.sort((a, b) => (b.topPick ? 1 : 0) - (a.topPick ? 1 : 0));

    title.textContent = searchQuery ? `Results for "${searchQuery}"` : (categoryNames[currentCategory] || 'All Products');
    count.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div>No products found.</div>';
        return;
    }

    grid.classList.toggle('list-view', currentView === 'list');

    grid.innerHTML = filtered.map((product, idx) => {
        const starsHtml = renderStars(product.rating);
        const badge = product.topPick ? '<span class="product-badge">⚡ Top Pick</span>' : '';
        const catLabel = categoryNames[product.category]?.replace(/^..\s/, '') || product.category;
        const inCompare = compareList.includes(product.asin);
        const inSetup = setupBag.includes(product.asin);

        return `
            <div class="product-card" style="animation-delay: ${Math.min(idx * 0.04, 0.6)}s">
                ${badge}
                <div class="card-actions">
                    <button class="card-action-btn ${inCompare ? 'active' : ''}" onclick="event.stopPropagation(); toggleCompare('${product.asin}')" title="Compare">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
                    </button>
                    <button class="card-action-btn ${inSetup ? 'active' : ''}" onclick="event.stopPropagation(); toggleSetup('${product.asin}')" title="Add to Setup">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                    <button class="card-action-btn" onclick="event.stopPropagation(); openQuickView('${product.asin}')" title="Quick View">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
                <div class="product-img-wrapper" onclick="openQuickView('${product.asin}')">
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
                    <a href="${affiliateUrl(product.asin)}" target="_blank" rel="noopener noreferrer" class="buy-btn" onclick="event.stopPropagation()">
                        Buy on Amazon <span class="prime-badge">Prime</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== QUICK VIEW (Slide-up Panel) ====================
function openQuickView(asin) {
    const product = allProducts.find(p => p.asin === asin);
    if (!product) return;

    const panel = document.getElementById('quickview-panel');
    const content = document.getElementById('quickview-content');
    const catLabel = categoryNames[product.category]?.replace(/^..\s/, '') || product.category;
    const starsHtml = renderStars(product.rating);
    const inSetup = setupBag.includes(asin);

    content.innerHTML = `
        <div class="quickview-handle"></div>
        <div class="quickview-inner">
            <div class="quickview-grid">
                <img class="quickview-img" src="${product.imageUrl}" alt="${product.name}">
                <div class="quickview-info">
                    <span class="product-category-tag">${catLabel}</span>
                    <h2>${product.name}</h2>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-meta">
                        <span class="product-price">${product.price}</span>
                        <span class="product-rating">${starsHtml} <span style="color:var(--text-muted); font-size:0.75rem; margin-left:4px">${product.rating}/5</span></span>
                    </div>
                    <div class="quickview-actions">
                        <a href="${affiliateUrl(product.asin)}" target="_blank" rel="noopener noreferrer" class="buy-btn">
                            Buy on Amazon <span class="prime-badge">Prime</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </a>
                        <button class="add-setup-btn" onclick="toggleSetup('${asin}'); openQuickView('${asin}');">
                            ${inSetup ? '✓ In Setup' : '+ Add to Setup'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    panel.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close search preview
    document.getElementById('search-preview').classList.remove('active');
}
window.openQuickView = openQuickView;

function closeQuickView() {
    document.getElementById('quickview-panel').classList.remove('active');
    document.body.style.overflow = '';
}
window.closeQuickView = closeQuickView;

// ==================== COMPARE ====================
function toggleCompare(asin) {
    const idx = compareList.indexOf(asin);
    if (idx > -1) {
        compareList.splice(idx, 1);
    } else {
        if (compareList.length >= 3) {
            compareList.shift();
        }
        compareList.push(asin);
    }
    updateCompareCount();
    renderProducts();
}
window.toggleCompare = toggleCompare;

function updateCompareCount() {
    const el = document.getElementById('compare-count');
    el.textContent = compareList.length;
    el.classList.toggle('visible', compareList.length > 0);
}

function openCompareModal() {
    const modal = document.getElementById('compare-modal');
    const body = document.getElementById('compare-body');

    if (compareList.length === 0) {
        body.innerHTML = '<div class="compare-empty"><span style="font-size:3rem">⚖️</span><h3>No products to compare</h3><p>Click the compare button on product cards to add them here (max 3).</p></div>';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        return;
    }

    const products = compareList.map(asin => allProducts.find(p => p.asin === asin)).filter(Boolean);

    const specs = [
        { label: 'Price', key: 'price', compare: 'lower' },
        { label: 'Rating', key: 'rating', compare: 'higher' },
        { label: 'Category', key: 'category' },
        { label: 'Description', key: 'description' },
    ];

    let headerHtml = '<th></th>' + products.map(p => `
        <td class="compare-product-header">
            <img src="${p.imageUrl}" alt="${p.name}">
            <h4>${p.name}</h4>
            <span class="compare-remove" onclick="toggleCompare('${p.asin}'); openCompareModal();">Remove</span>
        </td>
    `).join('');

    let rowsHtml = specs.map(spec => {
        const values = products.map(p => {
            if (spec.key === 'rating') return p.rating;
            return p[spec.key];
        });

        // Find winner
        let winnerIdx = -1;
        if (spec.compare === 'lower') {
            const nums = values.map(v => parsePrice(String(v)));
            winnerIdx = nums.indexOf(Math.min(...nums));
        } else if (spec.compare === 'higher') {
            winnerIdx = values.indexOf(Math.max(...values));
        }

        const cells = values.map((v, i) => {
            const isWinner = i === winnerIdx;
            const display = spec.key === 'rating' ? `${v} ★` : v;
            return `<td class="${isWinner ? 'winner' : ''}">${display}</td>`;
        }).join('');

        return `<tr><th>${spec.label}</th>${cells}</tr>`;
    }).join('');

    // Add buy row
    rowsHtml += '<tr><th>Buy</th>' + products.map(p => `
        <td><a href="${affiliateUrl(p.asin)}" target="_blank" rel="noopener noreferrer" class="buy-btn" style="display:inline-flex; padding:10px 16px; font-size:0.78rem;">Buy <span class="prime-badge">Prime</span></a></td>
    `).join('') + '</tr>';

    body.innerHTML = `
        <h2 style="font-family:var(--font-display); font-size:1.5rem; font-weight:700; letter-spacing:-0.5px; margin-bottom:24px;">Compare Products</h2>
        <table class="compare-table">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openCompareModal = openCompareModal;

function closeCompareModal() {
    document.getElementById('compare-modal').classList.remove('active');
    document.body.style.overflow = '';
}
window.closeCompareModal = closeCompareModal;

// ==================== SETUP BAG ====================
function toggleSetup(asin) {
    const idx = setupBag.indexOf(asin);
    if (idx > -1) setupBag.splice(idx, 1);
    else setupBag.push(asin);
    localStorage.setItem('kaeva-setup', JSON.stringify(setupBag));
    updateSetupCount();
    renderProducts();
}
window.toggleSetup = toggleSetup;

function updateSetupCount() {
    const el = document.getElementById('setup-count');
    el.textContent = setupBag.length;
    el.classList.toggle('visible', setupBag.length > 0);
}

function toggleSetupBag() {
    const sidebar = document.getElementById('setup-sidebar');
    const isActive = sidebar.classList.toggle('active');
    document.body.style.overflow = isActive ? 'hidden' : '';
    if (isActive) renderSetupSidebar();
}
window.toggleSetupBag = toggleSetupBag;

function renderSetupSidebar() {
    const body = document.getElementById('setup-sidebar-body');
    const footer = document.getElementById('setup-sidebar-footer');

    if (setupBag.length === 0) {
        body.innerHTML = '<div class="setup-empty"><span style="font-size:2.5rem">🛒</span><p>Add products to build your setup collection</p></div>';
        footer.style.display = 'none';
        return;
    }

    footer.style.display = '';
    const products = setupBag.map(asin => allProducts.find(p => p.asin === asin)).filter(Boolean);
    let total = products.reduce((sum, p) => sum + parsePrice(p.price), 0);

    body.innerHTML = products.map(p => `
        <div class="setup-item">
            <img src="${p.imageUrl}" alt="${p.name}">
            <div class="setup-item-info">
                <h4>${p.name}</h4>
                <span>${p.price}</span>
            </div>
            <button class="setup-item-remove" onclick="toggleSetup('${p.asin}'); renderSetupSidebar();">×</button>
        </div>
    `).join('');

    document.getElementById('setup-total-price').textContent = '$' + total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function buyAllSetup() {
    const products = setupBag.map(asin => allProducts.find(p => p.asin === asin)).filter(Boolean);
    products.forEach(p => {
        window.open(affiliateUrl(p.asin), '_blank');
    });
}
window.buyAllSetup = buyAllSetup;

// ==================== EXPERIENCES ====================
const experiences = {
    'ai-setup': {
        title: 'Build Your Own AI Setup',
        desc: 'Step-by-step guide to building a home AI/ML workstation. Click each step to see the recommended product.',
        steps: [
            { label: 'GPU — The Brain', desc: 'VRAM is everything for AI. 24GB minimum for serious training.', asin: 'B0DYVCGVK4' },
            { label: 'CPU — Processing Power', desc: '16 cores minimum for data preprocessing and multi-tasking.', asin: 'B0BBHD5D8Y' },
            { label: 'RAM — Working Memory', desc: '64GB DDR5 for large model loading and dataset handling.', asin: 'B0D1G2KKY2' },
            { label: 'Primary SSD — Speed', desc: 'NVMe for OS and active datasets. Speed matters.', asin: 'B0BHJJ9Y77' },
            { label: 'Bulk Storage — Capacity', desc: '4TB NVMe for checkpoints, datasets, and model archives.', asin: 'B0DZK9C789' },
            { label: 'Motherboard — Foundation', desc: 'PCIe 5.0, Thunderbolt 4, 10G LAN — future-proofed.', asin: 'B0DF123GCV' },
            { label: 'PSU — Reliable Power', desc: '1500W Platinum for multi-GPU headroom.', asin: 'B0F1NGKBK3' },
            { label: 'Cooling — Stay Quiet', desc: 'Dual-tower air cooler. Silent, reliable, zero maintenance.', asin: 'B07Y87YHRH' },
        ]
    },
    'gaming-desk': {
        title: 'The Ultimate Gaming Desk Setup',
        desc: 'Every component of a dream gaming station. Click to explore each piece.',
        steps: [
            { label: 'Monitor — The View', desc: '27" OLED, 240Hz, QHD — the centerpiece.', asin: 'B0B8RVH517' },
            { label: 'GPU — Raw Power', desc: 'RTX 4090 for max frames at max settings.', asin: 'B0DYVCGVK4' },
            { label: 'Keyboard — Control', desc: 'Optical-mechanical, per-key RGB, iCUE wheel.', asin: 'B0FWRDZ1QW' },
            { label: 'Mouse — Precision', desc: '60g ultralight, 44K DPI, pro wireless.', asin: 'B0CW25XR5R' },
            { label: 'Headset — Audio', desc: 'Multi-system ANC wireless with hot-swap battery.', asin: 'B0FH5XX7GP' },
            { label: 'Chair — Comfort', desc: 'Secretlab Titan for marathon sessions.', asin: 'B0DP5SY554' },
        ]
    },
    'smart-home': {
        title: 'Smart Home Starter Kit',
        desc: 'Network your home like a pro. Here\'s what you need and how it all connects.',
        steps: [
            { label: 'Router — The Hub', desc: 'WiFi 6 gaming router with AiMesh and 2.5G WAN.', asin: 'B09PRB1MZM' },
            { label: 'Mesh WiFi — Coverage', desc: 'WiFi 6E whole-home mesh for 5,400 sq ft.', asin: 'B0DKVDZXSN' },
            { label: 'Switch — Wired Backbone', desc: '8-port gigabit, plug & play, fanless.', asin: 'B00A121WN6' },
            { label: 'NAS — Storage Hub', desc: '4-bay NAS for backups, media, and file sharing.', asin: 'B09VXCSLR4' },
            { label: 'UPS — Protection', desc: 'Battery backup for your entire network stack.', asin: 'B00429N19W' },
        ]
    },
    'dev-workstation': {
        title: 'Developer Workstation Essentials',
        desc: 'For coders and AI/ML engineers — peak productivity gear.',
        steps: [
            { label: 'Monitor — Screen Real Estate', desc: '40" 5K2K ultrawide, Thunderbolt 4, Nano IPS.', asin: 'B0D7Q8N64F' },
            { label: 'Chair — Ergonomics', desc: 'Herman Miller Aeron — gold standard.', asin: 'B01DGM7ZII' },
            { label: 'Keyboard — Typing Feel', desc: '75% wireless, QMK/VIA, gasket mount.', asin: 'B0CR1JHZ6R' },
            { label: 'Mouse — Workflow', desc: 'MX Master 3S — quiet clicks, multi-device.', asin: 'B09HM94VDS' },
            { label: 'Desk — Foundation', desc: 'Jarvis standing desk — programmable, whisper-quiet.', asin: 'B07V6ZSHF4' },
            { label: 'Dock — Connectivity', desc: 'CalDigit TS4 — 18 ports, 98W charging.', asin: 'B09GK8LBWS' },
            { label: 'Light — Eye Care', desc: 'BenQ ScreenBar Halo — zero glare, auto-dimming.', asin: 'B08WT889V3' },
        ]
    }
};

function openExperience(id) {
    const exp = experiences[id];
    if (!exp) return;

    const modal = document.getElementById('experience-modal');
    const body = document.getElementById('experience-body');

    const stepsHtml = exp.steps.map((step, i) => {
        const product = allProducts.find(p => p.asin === step.asin);
        const productHtml = product ? `
            <div class="exp-step-product" onclick="event.stopPropagation(); openQuickView('${product.asin}')">
                <img src="${product.imageUrl}" alt="${product.name}">
                <div class="exp-step-product-info">
                    <h5>${product.name}</h5>
                    <span>${product.price}</span>
                </div>
            </div>
        ` : '';

        return `
            <div class="exp-step ${i === 0 ? 'active' : ''}" onclick="activateStep(this)">
                <div class="exp-step-num">${i + 1}</div>
                <div class="exp-step-content">
                    <h4>${step.label}</h4>
                    <p>${step.desc}</p>
                    ${productHtml}
                </div>
            </div>
        `;
    }).join('');

    const totalCost = exp.steps.reduce((sum, step) => {
        const product = allProducts.find(p => p.asin === step.asin);
        return sum + (product ? parsePrice(product.price) : 0);
    }, 0);

    body.innerHTML = `
        <div class="exp-modal-header">
            <h2>${exp.title}</h2>
            <p>${exp.desc}</p>
        </div>
        <div class="exp-steps">${stepsHtml}</div>
        <div class="exp-running-total">
            <span class="total-label">Total Build Cost</span>
            <span class="total-price">$${totalCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openExperience = openExperience;

function activateStep(el) {
    el.parentElement.querySelectorAll('.exp-step').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}
window.activateStep = activateStep;

function closeExperienceModal() {
    document.getElementById('experience-modal').classList.remove('active');
    document.body.style.overflow = '';
}
window.closeExperienceModal = closeExperienceModal;

// ==================== CUSTOM CURSOR ====================
function initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring || matchMedia('(hover: none)').matches) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    document.addEventListener('mousedown', () => ring.classList.add('clicking'));
    document.addEventListener('mouseup', () => ring.classList.remove('clicking'));

    // hover detection
    const hoverTargets = 'a, button, .product-card, .featured-card, .experience-card, .cat-card, .editorial-card, input, .nav-link, .cta-btn, .buy-btn';
    document.addEventListener('mouseover', e => {
        if (e.target.closest(hoverTargets)) { dot.classList.add('hovering'); ring.classList.add('hovering'); }
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest(hoverTargets)) { dot.classList.remove('hovering'); ring.classList.remove('hovering'); }
    });

    (function loop() {
        dot.style.left = mx + 'px'; dot.style.top = my + 'px';
        rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(loop);
    })();
}

// ==================== LETTER SPLIT ====================
function initLetterSplit() {
    document.querySelectorAll('[data-split]').forEach(el => {
        const text = el.textContent;
        el.innerHTML = '';
        text.split('').forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.style.animationDelay = (0.4 + i * 0.04) + 's';
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            el.appendChild(span);
        });
    });
}

// ==================== MAGNETIC BUTTONS ====================
function initMagneticButtons() {
    if (matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.cta-btn, .featured-buy, .exp-cta').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// ==================== HERO PARALLAX ====================
function initHeroParallax() {
    const bg = document.getElementById('hero-parallax-bg');
    if (!bg) return;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.5) {
            bg.style.transform = `translateY(${y * 0.3}px) scale(1.1)`;
        }
    }, { passive: true });
}

// ==================== SCROLL PROGRESS ====================
function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }, { passive: true });
}

// ==================== MARQUEE ====================
function renderMarquee() {
    const inner = document.getElementById('marquee-inner');
    if (!inner || !allProducts.length) return;
    const top = [...allProducts].sort((a,b) => (b.rating||0) - (a.rating||0)).slice(0, 12);
    const items = [...top, ...top];
    inner.innerHTML = items.map(p => `
        <a href="${affiliateUrl(p.asin)}" target="_blank" rel="noopener" class="marquee-card">
            <img src="${p.image || ''}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
            <div class="marquee-card-info">
                <h4>${p.name}</h4>
                <span>${p.price}</span>
            </div>
        </a>
    `).join('');
}

// ==================== STAGGER REVEAL ====================
function initStaggerReveal() {
    document.querySelectorAll('.featured-grid, .experience-grid, .cat-grid, .trust-grid, .editorial-grid').forEach(grid => {
        [...grid.children].forEach((child, i) => {
            child.classList.add('stagger-item');
            child.style.transitionDelay = (i * 0.08) + 's';
        });
    });
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.stagger-item').forEach(el => observer.observe(el));
}
