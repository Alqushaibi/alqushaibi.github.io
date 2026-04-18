/* ============================================================
   Alawi Alqushaibi – Academic Homepage | main.js
   ============================================================ */

'use strict';

/* ── State ───────────────────────────────────────────────── */
let allPubs       = [];
let activeFilter  = 'all';
let activeSort    = 'citations';
let searchQuery   = '';

/* ── Helpers ─────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightAuthor(authorsStr) {
  const variants = ['A Alqushaibi', 'Alqushaibi A', 'Alawi Alqushaibi'];
  let result = escapeHtml(authorsStr);
  variants.forEach(v => {
    result = result.replace(new RegExp(escapeHtml(v), 'gi'),
      '<strong>$&</strong>');
  });
  return result;
}

/* ── Data Loading ────────────────────────────────────────── */
async function loadData() {
  try {
    const res  = await fetch('assets/data/publications.json');
    const data = await res.json();
    allPubs = data.publications;
    updateMetrics(data.metrics, data.last_updated);
    renderPublications();
    updateTabBadge(allPubs.length);
    animateCounters();
  } catch (err) {
    console.error('Failed to load publications:', err);
    $('#pubList').innerHTML = '<p style="color:#e53e3e;padding:2rem">Could not load publications data.</p>';
  }
}

/* ── Metrics ─────────────────────────────────────────────── */
function updateMetrics(metrics, lastUpdated) {
  if (!metrics) return;
  const el = (id, val) => { const e = document.getElementById(id); if (e) { e.dataset.count = val; e.textContent = val.toLocaleString(); } };
  el('totalCitations',  metrics.citations);
  el('hIndex',          metrics.h_index);
  el('i10Index',        metrics.i10_index);
  el('pubCountMetric',  allPubs.length);
  const lu = document.getElementById('lastUpdated');
  if (lu && lastUpdated) {
    const d = new Date(lastUpdated);
    lu.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
}

/* ── Animated Counters ───────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  if (isNaN(target)) return;
  const duration = 1500;
  const start = performance.now();
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = Math.round(easeOut(progress) * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  $$('.metric-value').forEach(el => observer.observe(el));
}

/* ── Publications ────────────────────────────────────────── */
function getFilteredSorted() {
  let pubs = [...allPubs];

  if (activeFilter !== 'all') {
    pubs = pubs.filter(p => p.type === activeFilter);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    pubs = pubs.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.authors.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q) ||
      String(p.year).includes(q)
    );
  }

  if (activeSort === 'citations') {
    pubs.sort((a, b) => (b.citations || 0) - (a.citations || 0));
  } else if (activeSort === 'year') {
    pubs.sort((a, b) => b.year - a.year);
  } else if (activeSort === 'title') {
    pubs.sort((a, b) => a.title.localeCompare(b.title));
  }

  return pubs;
}

function typeLabel(type) {
  const map = { journal: 'Journal Article', conference: 'Conference Paper', book: 'Book Chapter' };
  return map[type] || type;
}

function typeBadgeClass(type) {
  const map = { journal: 'badge-type-journal', conference: 'badge-type-conference', book: 'badge-type-book' };
  return map[type] || '';
}

function quartileBadgeClass(q) {
  if (!q) return '';
  if (q === 'Q1') return 'badge-q1';
  if (q === 'Q2') return 'badge-q2';
  if (q === 'Q3') return 'badge-q3';
  return 'badge-indexed';
}

function renderPublications() {
  const list  = document.getElementById('pubList');
  const empty = document.getElementById('pubEmpty');
  const pubs  = getFilteredSorted();

  if (!pubs.length) {
    list.innerHTML  = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = pubs.map((pub, i) => {
    const qBadge = pub.quartile
      ? `<span class="pub-badge ${quartileBadgeClass(pub.quartile)}">${escapeHtml(pub.quartile)}${pub.impact_factor ? ` · IF ${escapeHtml(pub.impact_factor)}` : ''}</span>`
      : '';

    const idxBadge = pub.indexed
      ? `<span class="pub-badge badge-indexed">${escapeHtml(pub.indexed)}</span>`
      : '';

    const volInfo = pub.volume
      ? `, <em>${escapeHtml(pub.venue)}</em> ${escapeHtml(pub.volume)}`
      : `, <em>${escapeHtml(pub.venue)}</em>`;

    return `
    <div class="pub-item" data-type="${escapeHtml(pub.type)}" style="animation-delay:${i * 0.03}s">
      <div class="pub-rank">
        <span class="pub-rank-num">${i + 1}</span>
      </div>
      <div class="pub-body">
        <div class="pub-title">${escapeHtml(pub.title)}</div>
        <div class="pub-authors">${highlightAuthor(pub.authors)}</div>
        <div class="pub-venue">${escapeHtml(pub.venue)}${pub.volume ? ' ' + escapeHtml(pub.volume) : ''}</div>
        <div class="pub-meta">
          <span class="pub-badge badge-year">${pub.year}</span>
          <span class="pub-badge ${typeBadgeClass(pub.type)}">${typeLabel(pub.type)}</span>
          ${qBadge}
          ${idxBadge}
        </div>
      </div>
      <div class="pub-citations">
        <i class="fas fa-quote-left citation-icon"></i>
        <span class="citation-count">${(pub.citations || 0).toLocaleString()}</span>
        <span class="citation-label">Citations</span>
      </div>
    </div>`.trim();
  }).join('');
}

function updateTabBadge(count) {
  const badge = document.getElementById('pubCount');
  if (badge) badge.textContent = count;
}

/* ── Tab Switching ───────────────────────────────────────── */
function initTabs() {
  const btns     = $$('.tab-btn');
  const contents = $$('.tab-content');

  function activate(tabId) {
    btns.forEach(b     => b.classList.toggle('active', b.dataset.tab === tabId));
    contents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
    history.replaceState(null, '', `#${tabId}`);
    window.scrollTo({ top: document.getElementById('tabNav').offsetTop - 64, behavior: 'smooth' });
    if (tabId === 'publications') renderPublications();
  }

  btns.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.tab)));

  // Navbar links
  $$('.nav-link[data-tab]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      activate(link.dataset.tab);
      $$('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Hash routing
  const hash = location.hash.replace('#', '');
  if (['about', 'publications', 'cv'].includes(hash)) activate(hash);
}

/* ── Filters & Search ────────────────────────────────────── */
function initControls() {
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderPublications();
    });
  });

  const searchInput = document.getElementById('pubSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      renderPublications();
    });
  }

  const sortSelect = document.getElementById('pubSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      renderPublications();
    });
  }
}

/* ── Mobile Nav ──────────────────────────────────────────── */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    $$('.nav-link').forEach(l => l.addEventListener('click', () => links.classList.remove('open')));
  }
}

/* ── Sticky Navbar ───────────────────────────────────────── */
function initStickyNav() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 20px rgba(0,0,0,0.25)'
      : '0 2px 16px rgba(0,0,0,0.18)';
  }, { passive: true });
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initControls();
  initMobileNav();
  initStickyNav();
  loadData();
});
