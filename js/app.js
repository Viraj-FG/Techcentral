/* ========== KAEVA App — Premium Redesign 2026 ========== */

let allProducts = [];
let currentCategory = 'all';
let searchQuery = '';
let currentView = 'grid';

const categoryNames = {
    all: 'All Products',
    gaming: '🎮 Gaming',
    ai: '🤖 AI / ML',
    coding: '💻 Coding',
    peripherals: '🎧 Peripherals',
    networking: '🌐 Networking'
};

// ==================== DEBOUNCE UTILITY ====================
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initScrollEffects();
    initCounters();
    initMobileMenu();
    initViewToggle();
    initBackToTop();
    initKeyboardShortcuts();

    fetch('./data/products.json')
        .then(r => r.json())
        .then(data => {
            allProducts = data;
            updateCategoryCounts();
            renderFeatured();
            renderProducts();
        })
        .catch(err => {
            console.error('Failed to load products:', err);
            document.getElementById('product-grid').innerHTML =
                '<div class="no-results"><div class="no-results-icon">🔌</div>Failed to load products.</div>';
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
    let animId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    const count = Math.min(35, Math.floor(window.innerWidth / 45));
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.2 + 0.03,
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
            if (dist < 100) {
                const force = (100 - dist) / 100;
                p.x += (dx / dist) * force * 1.5;
                p.y += (dy / dist) * force * 1.5;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 214, 50, ${p.opacity})`;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                if (d < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 214, 50, ${0.04 * (1 - d / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
        animId = requestAnimationFrame(animate);
    }
    
    // Performance: pause when tab hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animId);
        } else {
            animate();
        }
    });
    
    animate();
}

// ==================== SCROLL EFFECTS ====================
function initScrollEffects() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.style.getPropertyValue('--i');
                if (delay !== '') {
                    entry.target.style.transitionDelay = `${delay * 0.1}s`;
                }
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==================== COUNTER ANIMATION ====================
function initCounters() {
    const counters = document.querySelectorAll('.stat-num[data-count]');
    counters.forEach(el => {
        const target = parseInt(el.dataset.count);
        let current = 0;
        const duration = 1200;
        const startTime = performance.now();
        
        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(target * eased);
            el.textContent = current;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
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
            const grid = document.getElementById('product-grid');
            grid.classList.toggle('list-view', currentView === 'list');
        });
    });
}

// ==================== BACK TO TOP ====================
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // "/" to focus search
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            const active = document.activeElement;
            if (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
                e.preventDefault();
                document.getElementById('search').focus();
            }
        }
        // Escape to close modal / blur search
        if (e.key === 'Escape') {
            closeQuickView();
            document.getElementById('search').blur();
        }
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

// ==================== FEATURED / TOP PICKS ====================
function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    const topPicks = allProducts.filter(p => p.topPick).slice(0, 6);
    
    grid.innerHTML = topPicks.map((product, idx) => {
        const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=grubsight-20`;
        const catLabel = categoryNames[product.category]?.replace(/^..\s/, '') || product.category;
        const starsHtml = renderStars(product.rating);
        
        return `
            <div class="featured-card reveal" style="--i:${idx}" onclick="openQuickView('${product.asin}')">
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
                        <a href="${affiliateUrl}" target="_blank" rel="noopener noreferrer" class="featured-buy" onclick="event.stopPropagation()">
                            Buy
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Re-observe reveals
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.style.getPropertyValue('--i');
                if (delay !== '') entry.target.style.transitionDelay = `${delay * 0.08}s`;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });
    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==================== FILTER ====================
function filterCategory(cat, linkEl) {
    currentCategory = cat;
    searchQuery = '';
    document.getElementById('search').value = '';

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (linkEl) {
        linkEl.classList.add('active');
    } else {
        document.querySelectorAll('.nav-link').forEach(l => {
            if (l.dataset.category === cat) l.classList.add('active');
        });
    }

    const hero = document.getElementById('hero');
    const catSection = document.getElementById('categories-section');
    const featuredSection = document.querySelector('.featured-section');
    const trustSection = document.querySelector('.trust-section');
    
    if (cat !== 'all') {
        hero.style.display = 'none';
        catSection.style.display = 'none';
        if (featuredSection) featuredSection.style.display = 'none';
        if (trustSection) trustSection.style.display = 'none';
    } else {
        hero.style.display = '';
        catSection.style.display = '';
        if (featuredSection) featuredSection.style.display = '';
        if (trustSection) trustSection.style.display = '';
    }

    renderProducts();
    if (cat !== 'all') {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showAll() {
    filterCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// ==================== RENDER PRODUCTS ====================
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

    filtered.sort((a, b) => (b.topPick ? 1 : 0) - (a.topPick ? 1 : 0));

    title.textContent = searchQuery
        ? `Results for "${searchQuery}"`
        : (categoryNames[currentCategory] || 'All Products');
    count.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div>No products found.<br>Try a different search or category.</div>';
        return;
    }

    grid.classList.toggle('list-view', currentView === 'list');

    grid.innerHTML = filtered.map((product, idx) => {
        const starsHtml = renderStars(product.rating);
        const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=grubsight-20`;
        const badge = product.topPick ? '<span class="product-badge">⚡ Top Pick</span>' : '';
        const catLabel = categoryNames[product.category]?.replace(/^..\s/, '') || product.category;

        return `
            <div class="product-card" style="animation-delay: ${Math.min(idx * 0.04, 0.6)}s">
                ${badge}
                <button class="quick-view-btn" onclick="event.stopPropagation(); openQuickView('${product.asin}')" aria-label="Quick view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
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

// ==================== QUICK VIEW ====================
function openQuickView(asin) {
    const product = allProducts.find(p => p.asin === asin);
    if (!product) return;

    const modal = document.getElementById('quick-view-modal');
    const body = document.getElementById('modal-body');
    const affiliateUrl = `https://www.amazon.com/dp/${product.asin}?tag=grubsight-20`;
    const catLabel = categoryNames[product.category]?.replace(/^..\s/, '') || product.category;
    const starsHtml = renderStars(product.rating);

    body.innerHTML = `
        <img class="modal-img" src="${product.imageUrl}" alt="${product.name}">
        <div class="modal-info">
            <span class="product-category-tag">${catLabel}</span>
            <h2>${product.name}</h2>
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
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) closeQuickView();
    };
}

function closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}
