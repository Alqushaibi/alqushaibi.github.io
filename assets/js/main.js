/* ============================================================
   Alawi Alqushaibi – Academic Homepage | main.js
   ============================================================ */

'use strict';

/* ── State ───────────────────────────────────────────────── */
let allPubs        = [];
let activeFilter   = 'all';
let activeSort     = 'citations';
let searchQuery    = '';
let supervisionData = null;
let fypStatusFilter = 'all';
let mediaData      = [];
let mediaFilter    = 'all';

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
    result = result.replace(new RegExp(escapeHtml(v), 'gi'), '<strong>$&</strong>');
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
  if (activeFilter !== 'all') pubs = pubs.filter(p => p.type === activeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    pubs = pubs.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.authors.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q) ||
      String(p.year).includes(q)
    );
  }
  if (activeSort === 'citations')      pubs.sort((a, b) => (b.citations || 0) - (a.citations || 0));
  else if (activeSort === 'year')      pubs.sort((a, b) => b.year - a.year);
  else if (activeSort === 'title')     pubs.sort((a, b) => a.title.localeCompare(b.title));
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
    return `
    <div class="pub-item" data-type="${escapeHtml(pub.type)}" style="animation-delay:${i * 0.03}s">
      <div class="pub-rank"><span class="pub-rank-num">${i + 1}</span></div>
      <div class="pub-body">
        <div class="pub-title">${escapeHtml(pub.title)}</div>
        <div class="pub-authors">${highlightAuthor(pub.authors)}</div>
        <div class="pub-venue">${escapeHtml(pub.venue)}${pub.volume ? ' ' + escapeHtml(pub.volume) : ''}</div>
        <div class="pub-meta">
          <span class="pub-badge badge-year">${pub.year}</span>
          <span class="pub-badge ${typeBadgeClass(pub.type)}">${typeLabel(pub.type)}</span>
          ${qBadge}${idxBadge}
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

/* ── Supervision ─────────────────────────────────────────── */
async function loadSupervisionData() {
  try {
    const res = await fetch('assets/data/supervision.json');
    supervisionData = await res.json();
    renderSupervision();
    updateSupervisionBadges();
  } catch (err) {
    console.error('Failed to load supervision data:', err);
  }
}

function updateSupervisionBadges() {
  if (!supervisionData) return;
  const phdBadge = document.querySelector('.sup-tab-btn[data-suptab="phd"] .tab-badge');
  const fypBadge = document.querySelector('.sup-tab-btn[data-suptab="fyp"] .tab-badge');
  if (phdBadge) phdBadge.textContent = supervisionData.phd.length;
  if (fypBadge) fypBadge.textContent = supervisionData.fyp.length;
}

function renderSupervision() {
  if (!supervisionData) return;
  renderPhd();
  renderMasters();
  renderFyp();
}

function renderPhd() {
  const container = document.getElementById('phdGrid');
  if (!container) return;
  if (!supervisionData.phd.length) {
    container.innerHTML = '<div class="coming-soon"><i class="fas fa-user-clock"></i><h3>No PhD students yet</h3></div>';
    return;
  }
  container.innerHTML = supervisionData.phd.map(s => `
    <div class="student-card phd-card">
      <div class="student-header">
        <div class="student-avatar phd-avatar"><i class="fas fa-user-graduate"></i></div>
        <div class="student-title-block">
          <h3>${escapeHtml(s.name)}</h3>
          <span class="student-degree">${escapeHtml(s.degree || 'Ph.D. Candidate')}</span>
        </div>
        <span class="student-status-badge ${s.status}">${s.status === 'current' ? 'Current' : 'Graduated'}</span>
      </div>
      <div class="student-details">
        ${s.university ? `<div class="student-detail-item"><i class="fas fa-university"></i><span>${escapeHtml(s.university)}</span></div>` : ''}
        ${s.role ? `<div class="student-detail-item"><i class="fas fa-user-tie"></i><span>Role: <strong>${escapeHtml(s.role)}</strong></span></div>` : ''}
        ${s.research_area ? `<div class="student-detail-item"><i class="fas fa-flask"></i><span>Research area: ${escapeHtml(s.research_area)}</span></div>` : ''}
        ${s.thesis ? `<div class="student-detail-item"><i class="fas fa-book"></i><span>Thesis: <strong>${escapeHtml(s.thesis)}</strong></span></div>` : ''}
      </div>
    </div>
  `).join('');
}

function renderMasters() {
  const container = document.getElementById('mastersGrid');
  if (!container) return;
  if (!supervisionData.masters || !supervisionData.masters.length) {
    container.innerHTML = `<div class="coming-soon">
      <i class="fas fa-user-clock"></i>
      <h3>Master Students</h3>
      <p>Master student supervision details will be added soon.</p>
    </div>`;
    return;
  }
  container.innerHTML = `<div class="students-grid">` + supervisionData.masters.map(s => `
    <div class="student-card phd-card">
      <div class="student-header">
        <div class="student-avatar phd-avatar"><i class="fas fa-graduation-cap"></i></div>
        <div class="student-title-block">
          <h3>${escapeHtml(s.name)}</h3>
          <span class="student-degree">${escapeHtml(s.degree || "Master's Candidate")}</span>
        </div>
        <span class="student-status-badge ${s.status}">${s.status === 'current' ? 'Current' : 'Graduated'}</span>
      </div>
      <div class="student-details">
        ${s.university ? `<div class="student-detail-item"><i class="fas fa-university"></i><span>${escapeHtml(s.university)}</span></div>` : ''}
        ${s.role ? `<div class="student-detail-item"><i class="fas fa-user-tie"></i><span>Role: <strong>${escapeHtml(s.role)}</strong></span></div>` : ''}
        ${s.research_area ? `<div class="student-detail-item"><i class="fas fa-flask"></i><span>Research area: ${escapeHtml(s.research_area)}</span></div>` : ''}
      </div>
    </div>
  `).join('') + `</div>`;
}

function renderFyp() {
  const container = document.getElementById('fypGrid');
  if (!container || !supervisionData) return;
  const allFyp = supervisionData.fyp;
  const filtered = fypStatusFilter === 'all' ? allFyp : allFyp.filter(s => s.status === fypStatusFilter);
  const countAll       = allFyp.length;
  const countCompleted = allFyp.filter(s => s.status === 'completed').length;
  const countCurrent   = allFyp.filter(s => s.status === 'current').length;
  $$('.fyp-filter-btn').forEach(btn => {
    const countEl = btn.querySelector('.filter-count');
    if (!countEl) return;
    if (btn.dataset.fypstatus === 'all')       countEl.textContent = countAll;
    if (btn.dataset.fypstatus === 'completed') countEl.textContent = countCompleted;
    if (btn.dataset.fypstatus === 'current')   countEl.textContent = countCurrent;
  });
  if (!filtered.length) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:2rem 0">No students match this filter.</p>';
    return;
  }
  container.innerHTML = filtered.map(s => `
    <div class="student-card fyp-card" data-fypstatus="${escapeHtml(s.status)}">
      <div class="student-header">
        <div class="student-avatar fyp-avatar ${s.status}">
          <i class="fas ${s.status === 'completed' ? 'fa-check-circle' : 'fa-spinner'}"></i>
        </div>
        <div class="student-title-block">
          <h3>${escapeHtml(s.name)}</h3>
          <span class="student-degree">Final Year Project</span>
        </div>
        <span class="student-status-badge ${s.status}">${s.status === 'current' ? 'Current' : 'Completed'}</span>
      </div>
      <div class="student-details">
        <div class="student-detail-item">
          <i class="fas fa-project-diagram"></i>
          <span>Title: <strong>${escapeHtml(s.title)}</strong></span>
        </div>
        <div class="student-detail-item">
          <i class="fas fa-user-tie"></i>
          <span>Role: <strong>${escapeHtml(s.role)}</strong></span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── Media ───────────────────────────────────────────────── */
async function loadMediaData() {
  try {
    const res = await fetch('assets/data/media.json');
    const data = await res.json();
    mediaData = data.items || [];
    renderMedia();
  } catch (err) {
    console.error('Failed to load media data:', err);
  }
}

function renderMedia() {
  const grid  = document.getElementById('mediaGrid');
  const empty = document.getElementById('mediaEmpty');
  if (!grid) return;
  const items = mediaFilter === 'all' ? mediaData : mediaData.filter(i => i.type === mediaFilter);
  if (!items.length) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = items.map((item, idx) => {
    if (item.type === 'video') {
      const videoId = getYouTubeId(item.url);
      const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
      return `
        <div class="media-card" data-type="video">
          <div class="media-thumb video-thumb" onclick="openVideo('${escapeHtml(item.url)}')">
            ${thumb
              ? `<img src="${thumb}" alt="${escapeHtml(item.title)}" loading="lazy">`
              : '<div class="media-placeholder"><i class="fas fa-video"></i></div>'}
            <div class="media-play-btn"><i class="fas fa-play"></i></div>
          </div>
          <div class="media-info">
            <h4>${escapeHtml(item.title)}</h4>
            ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
            <div class="media-meta">
              ${item.date ? `<span class="media-date"><i class="fas fa-calendar-alt"></i> ${escapeHtml(item.date)}</span>` : ''}
              <span class="media-type-badge video"><i class="fas fa-video"></i> Video</span>
            </div>
          </div>
        </div>`;
    } else {
      return `
        <div class="media-card" data-type="image">
          <div class="media-thumb" onclick="openLightbox('${escapeHtml(item.url)}', '${escapeHtml(item.title)}')">
            <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title)}" loading="lazy">
            <div class="media-zoom-btn"><i class="fas fa-search-plus"></i></div>
          </div>
          <div class="media-info">
            <h4>${escapeHtml(item.title)}</h4>
            ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
            <div class="media-meta">
              ${item.date ? `<span class="media-date"><i class="fas fa-calendar-alt"></i> ${escapeHtml(item.date)}</span>` : ''}
              <span class="media-type-badge image"><i class="fas fa-image"></i> Image</span>
            </div>
          </div>
        </div>`;
    }
  }).join('');
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function openLightbox(url, title) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.querySelector('.lb-img').src = url;
  lb.querySelector('.lb-title').textContent = title;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function openVideo(url) {
  const videoId = getYouTubeId(url);
  if (!videoId) { window.open(url, '_blank'); return; }
  const vm = document.getElementById('videoModal');
  if (!vm) return;
  vm.querySelector('iframe').src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  vm.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const vm = document.getElementById('videoModal');
  if (lb) lb.style.display = 'none';
  if (vm) {
    vm.style.display = 'none';
    vm.querySelector('iframe').src = '';
  }
  document.body.style.overflow = '';
}

/* ── Tab Switching ───────────────────────────────────────── */
function initTabs() {
  const btns     = $$('.tab-btn');
  const contents = $$('.tab-content');
  const validTabs = ['about', 'teaching', 'supervision', 'publications', 'media', 'cv'];

  function activate(tabId) {
    if (!validTabs.includes(tabId)) tabId = 'about';
    btns.forEach(b     => b.classList.toggle('active', b.dataset.tab === tabId));
    contents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
    $$('.nav-link[data-tab]').forEach(l => l.classList.toggle('active', l.dataset.tab === tabId));
    history.replaceState(null, '', `#${tabId}`);
    const nav = document.getElementById('tabNav');
    if (nav) window.scrollTo({ top: nav.offsetTop - 64, behavior: 'smooth' });
    if (tabId === 'publications') renderPublications();
  }

  btns.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.tab)));
  $$('.nav-link[data-tab]').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); activate(link.dataset.tab); });
  });

  const hash = location.hash.replace('#', '');
  if (validTabs.includes(hash)) activate(hash);
}

/* ── Section Nav (About sub-sections) ───────────────────── */
function initSectionNav() {
  const btns   = $$('.snav-btn');
  const panels = $$('.section-panel');

  function showSection(id) {
    btns.forEach(b   => b.classList.toggle('active', b.dataset.section === id));
    panels.forEach(p => p.classList.toggle('active', p.id === `section-${id}`));
    /* Scroll so section nav bar is just visible at top */
    const snavBar = document.querySelector('.section-nav-bar');
    if (snavBar) {
      const y = snavBar.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  btns.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
}

/* ── Experience Filter ───────────────────────────────────── */
function initExpFilter() {
  $$('.exp-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.exp-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.expcat;
      /* Only filter cards inside the experience section */
      $$('#section-experience .exp-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.expcat === cat) ? '' : 'none';
      });
    });
  });
}

/* ── Teaching Filter ─────────────────────────────────────── */
function initTeachingFilter() {
  $$('.tfilter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tfilter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.tcat;
      $$('.subject-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.tcat === cat) ? '' : 'none';
      });
    });
  });
}

/* ── Supervision Sub-tabs ────────────────────────────────── */
function initSupervisionTabs() {
  const btns     = $$('.sup-tab-btn');
  const contents = $$('.suptab-content');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b     => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const el = document.getElementById(`suptab-${btn.dataset.suptab}`);
      if (el) el.classList.add('active');
    });
  });
}

/* ── FYP Filter ──────────────────────────────────────────── */
function initFypFilter() {
  $$('.fyp-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.fyp-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fypStatusFilter = btn.dataset.fypstatus;
      if (supervisionData) renderFyp();
    });
  });
}

/* ── Filters & Search (Publications) ────────────────────── */
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

/* ── Media Filter ────────────────────────────────────────── */
function initMediaFilter() {
  $$('.media-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.media-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mediaFilter = btn.dataset.mediatype;
      renderMedia();
    });
  });
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

/* ── Keyboard shortcut for lightbox ─────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSectionNav();
  initExpFilter();
  initTeachingFilter();
  initSupervisionTabs();
  initFypFilter();
  initControls();
  initMediaFilter();
  initMobileNav();
  initStickyNav();
  loadData();
  loadSupervisionData();
  loadMediaData();
});
