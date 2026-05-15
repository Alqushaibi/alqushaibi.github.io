/* ============================================================
   Alawi Alqushaibi – Academic Homepage | main.js
   ============================================================ */
'use strict';

/* ── State ── */
let allPubs         = [];
let activeFilter    = 'all';
let activeSort      = 'citations';
let searchQuery     = '';
let supervisionData = null;
let fypStatusFilter = 'all';
let mediaData       = [];
let mediaFilter     = 'all';
let siteContent     = null;
let expFilter       = 'all';

/* ── Helpers ── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* Fetch a data file directly from the GitHub API so the site always
   shows the latest saved content without waiting for Pages CDN to clear. */
async function fetchData(repoPath) {
  const url = `https://api.github.com/repos/alqushaibi/alqushaibi.github.io/contents/${repoPath}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const d = await res.json();
  const bin = atob(d.content.replace(/\n/g, ''));
  const text = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  return JSON.parse(text);
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function highlightAuthor(authorsStr) {
  const variants = ['A Alqushaibi','Alqushaibi A','Alawi Alqushaibi'];
  let result = esc(authorsStr);
  variants.forEach(v => {
    result = result.replace(new RegExp(esc(v),'gi'),'<strong>$&</strong>');
  });
  return result;
}

function dots(level) {
  return Array.from({length:5},(_,i)=>`<span class="dot${i<level?' filled':''}"></span>`).join('');
}

/* ════════════════════════════════════════════════════════════
   SITE CONTENT
════════════════════════════════════════════════════════════ */
async function loadSiteContent() {
  try {
    siteContent = await fetchData('assets/data/site-content.json');
    applyPageTabsConfig();
    renderBio();
    renderExperience();
    renderResearchProjects();
    renderSkills();
    renderAwards();
    renderMemberships();
    renderLeadership();
    renderTeaching();
    renderCvSection();
  } catch(err) {
    console.error('Failed to load site content:', err);
  }
}

function getDefaultPageTabs() {
  return [
    {id:'about', title:'Home', icon:'fas fa-user'},
    {id:'teaching', title:'Teaching', icon:'fas fa-chalkboard-teacher'},
    {id:'supervision', title:'Supervision', icon:'fas fa-user-graduate'},
    {id:'publications', title:'Publications', icon:'fas fa-book-open'},
    {id:'media', title:'Media', icon:'fas fa-images'},
    {id:'cv', title:'CV', icon:'fas fa-file-alt'}
  ];
}

function applyPageTabsConfig() {
  if (!siteContent) return;
  const tabs = Array.isArray(siteContent.page_tabs) && siteContent.page_tabs.length
    ? siteContent.page_tabs.filter(tab => !tab.hidden)
    : getDefaultPageTabs();

  const tabContainer = document.querySelector('.tab-container');
  const navLinks = document.getElementById('navLinks');
  if (!tabContainer || !navLinks) return;

  tabs.forEach(tab => {
    const btn = document.querySelector(`.tab-btn[data-tab="${tab.id}"]`);
    const nav = document.querySelector(`.nav-link[data-tab="${tab.id}"]`);
    if (btn) {
      btn.innerHTML = `<i class="${esc(tab.icon)}"></i> ${esc(tab.title)}`;
      tabContainer.appendChild(btn);
    }
    if (nav && nav.parentElement) {
      nav.innerHTML = `<i class="${esc(tab.icon)}"></i> ${esc(tab.title)}`;
      navLinks.appendChild(nav.parentElement);
    }
    const sectionTitle = document.querySelector(`#tab-${tab.id} .section-title span`);
    if (sectionTitle) sectionTitle.textContent = tab.title;
  });
}

/* ── Bio ── */
function renderBio() {
  const c = document.getElementById('bioContent');
  if (!c || !siteContent) return;
  const { bio, education, current_positions } = siteContent;

  const eduDotColors = ['','','','#f6ad55'];
  const eduDotClasses = ['phd','ms','bs',''];

  c.innerHTML = `
    <div class="about-main">
      <h2 class="section-title"><span>About Me</span></h2>
      ${bio.paragraphs.map(p=>`<p>${p}</p>`).join('')}
      <h3 class="subsection-title">Research Interests</h3>
      <div class="interest-tags">
        ${bio.research_interests.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}
      </div>
    </div>
    <div class="about-side">
      <div class="side-card">
        <h3><i class="fas fa-graduation-cap"></i> Education</h3>
        <div class="timeline">
          ${education.map((e,i)=>`
            <div class="timeline-item">
              <div class="timeline-dot ${eduDotClasses[i]||''}" ${e.dot_color?`style="background:${esc(e.dot_color)}"`:''}}></div>
              <div class="timeline-content">
                <strong>${esc(e.degree)}</strong>
                <span>${esc(e.institution)}</span>
                <span class="timeline-year">${esc(e.period)}</span>
                ${e.thesis?`<small>${esc(e.thesis)}</small>`:''}
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="side-card">
        <h3><i class="fas fa-briefcase"></i> Current Position</h3>
        ${current_positions.map(p=>`
          <div class="position-item">
            <strong>${esc(p.title)}</strong>
            <span>${esc(p.institution)}</span>
            <span class="timeline-year">${esc(p.period)}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ── Experience ── */
function renderExperience() {
  const c = document.getElementById('expTimeline');
  if (!c || !siteContent) return;
  const filtered = expFilter === 'all'
    ? siteContent.experience
    : siteContent.experience.filter(e => e.type === expFilter);

  c.innerHTML = filtered.map(e => `
    <div class="exp-card" data-expcat="${esc(e.type)}">
      <div class="exp-header">
        <div class="exp-icon ${esc(e.type)}"><i class="${esc(e.icon)}"></i></div>
        <div class="exp-title-block">
          <h3>${esc(e.title)}</h3>
          <span class="exp-company">${esc(e.company)}</span>
          <span class="exp-period">${esc(e.period)}</span>
        </div>
        <span class="exp-badge ${esc(e.badge_type)}">${esc(e.badge)}</span>
      </div>
      <ul class="exp-duties">
        ${e.duties.map(d=>`<li>${esc(d)}</li>`).join('')}
      </ul>
    </div>`).join('');
}

/* ── Research Projects ── */
function renderResearchProjects() {
  const c = document.getElementById('projectsGrid');
  if (!c || !siteContent) return;
  c.innerHTML = siteContent.research_projects.map(p => `
    <div class="project-card">
      <div class="project-badge">${esc(p.badge)}</div>
      <h4>${esc(p.title)}</h4>
      <p>${esc(p.description)}</p>
    </div>`).join('');
}

/* ── Skills ── */
function renderSkills() {
  const c = document.getElementById('skillsContent');
  if (!c || !siteContent) return;
  const { technical_skills, language_skills, reviewer_journals, workshops } = siteContent;

  c.innerHTML = `
    <div class="skills-grid">
      <div class="skills-card">
        <h3><i class="fas fa-language"></i> Languages</h3>
        ${language_skills.map(s=>`
          <div class="skill-item">
            <div class="skill-name"><span>${esc(s.flag)}</span> ${esc(s.name)}</div>
            <div class="skill-dots">${dots(s.level)}</div>
            <span class="skill-level-label">${esc(s.label)}</span>
          </div>`).join('')}
      </div>
      <div class="skills-card">
        <h3><i class="fas fa-code"></i> Technical Skills</h3>
        ${technical_skills.map(s=>`
          <div class="skill-item">
            <div class="skill-name"><i class="${esc(s.icon)}"></i> ${esc(s.name)}</div>
            <div class="skill-dots">${dots(s.level)}</div>
            <span class="skill-level-label">${esc(s.label)}</span>
          </div>`).join('')}
      </div>
      <div class="skills-card">
        <h3><i class="fas fa-check-double"></i> Journal Reviewer</h3>
        <div class="reviewer-tags">
          ${reviewer_journals.map(j=>`<span class="reviewer-tag">${esc(j)}</span>`).join('')}
        </div>
      </div>
    </div>
    <h3 class="subsection-title" style="margin-top:2rem">
      <i class="fas fa-certificate"></i> Competencies &amp; Workshops
    </h3>
    <div class="workshops-grid">
      ${workshops.map(w=>`
        <div class="workshop-card">
          <i class="${esc(w.icon)} workshop-icon"></i>
          <div>
            <strong>${esc(w.title)}</strong>
            <span>${esc(w.institution)} · ${esc(w.year)}</span>
          </div>
        </div>`).join('')}
    </div>`;
}

/* ── Awards ── */
function renderAwards() {
  const c = document.getElementById('awardsGrid');
  if (!c || !siteContent) return;
  c.innerHTML = siteContent.awards.map(a => `
    <div class="award-full-card ${esc(a.level)}">
      <div class="award-icon"><i class="${esc(a.icon)}"></i></div>
      <div class="award-info">
        <strong>${esc(a.title)}</strong>
        <span>${esc(a.issuer)} · ${esc(a.year)}</span>
        ${a.description?`<small>${esc(a.description)}</small>`:''}
      </div>
    </div>`).join('');
}

/* ── Memberships ── */
function renderMemberships() {
  const c = document.getElementById('membershipsGrid');
  if (!c || !siteContent) return;
  c.innerHTML = siteContent.memberships.map(m => `
    <div class="membership-card">
      <div class="membership-icon"><i class="${esc(m.icon)}"></i></div>
      <div class="membership-info">
        <strong>${esc(m.title)}</strong>
        <span>${esc(m.organization)}</span>
      </div>
    </div>`).join('');
}

/* ── Leadership ── */
function renderLeadership() {
  const c = document.getElementById('leadershipTimeline');
  if (!c || !siteContent) return;
  c.innerHTML = siteContent.leadership.map(l => `
    <div class="exp-card">
      <div class="exp-header">
        <div class="exp-icon" style="background:${esc(l.icon_gradient)}">
          <i class="${esc(l.icon)}"></i>
        </div>
        <div class="exp-title-block">
          <h3>${esc(l.title)}</h3>
          <span class="exp-company">${esc(l.organization)}</span>
          <span class="exp-period">${esc(l.period)}</span>
        </div>
      </div>
      <ul class="exp-duties">
        ${l.duties.map(d=>`<li>${esc(d)}</li>`).join('')}
      </ul>
    </div>`).join('');
}

/* ── Teaching ── */
const TEACH_ICONS = {
  'ai-data':'fas fa-brain', 'programming':'fas fa-code',
  'info-systems':'fas fa-sitemap', 'networks-systems':'fas fa-network-wired'
};
const TEACH_ICONS_MAP = {
  'Artificial Intelligence':'fas fa-brain',
  'Data Science':'fas fa-chart-bar',
  'Introduction to Programming':'fas fa-code',
  'Object-Oriented Programming':'fas fa-object-group',
  'Information Technology Fundamentals':'fas fa-laptop',
  'Database Management Systems':'fas fa-database',
  'Information Management':'fas fa-folder-open',
  'Information System':'fas fa-sitemap',
  'Wireless Communication':'fas fa-wifi',
  'Operating Systems':'fas fa-server',
  'Computer Architecture & Organization':'fas fa-microchip'
};

function renderTeaching() {
  const c = document.getElementById('subjectsGrid');
  if (!c || !siteContent) return;
  const subjects = siteContent.teaching;
  updateTeachingFilterCounts(subjects);
  c.innerHTML = subjects.map(s => {
    const icon = TEACH_ICONS_MAP[s.title] || TEACH_ICONS[s.category] || 'fas fa-book';
    return `
    <div class="subject-card" data-tcat="${esc(s.category)}">
      <div class="subject-icon ${esc(s.category)}"><i class="${icon}"></i></div>
      <h4>${esc(s.title)}</h4>
      <p>${esc(s.description)}</p>
      <div class="subject-meta">
        ${s.status==='current'?`<span class="subject-badge current">Currently Teaching</span>`:''}
        <span class="subject-level">${esc(s.level)}</span>
      </div>
    </div>`;
  }).join('');
}

function updateTeachingFilterCounts(subjects) {
  const counts = {};
  subjects.forEach(s => { counts[s.category] = (counts[s.category]||0)+1; });
  $$('.tfilter-btn').forEach(btn => {
    const ct = btn.querySelector('.filter-count');
    if (!ct) return;
    const cat = btn.dataset.tcat;
    ct.textContent = cat === 'all' ? subjects.length : (counts[cat]||0);
  });
}

/* ── CV Section ── */
function renderCvSection() {
  if (!siteContent) return;
  const fn = siteContent.cv_filename;
  const encoded = encodeURIComponent(fn);
  const dlLink = document.getElementById('cvDownloadLink');
  const iframe  = document.getElementById('cvIframe');
  if (dlLink) { dlLink.href = encoded; dlLink.download = fn; }
  if (iframe)   iframe.src  = encoded;
}

/* ════════════════════════════════════════════════════════════
   PUBLICATIONS
════════════════════════════════════════════════════════════ */
async function loadData() {
  try {
    const data = await fetchData('assets/data/publications.json');
    allPubs = data.publications;
    updateMetrics(data.metrics, data.last_updated);
    renderPublications();
    updateTabBadge(allPubs.length);
    animateCounters();
  } catch(err) {
    console.error('Failed to load publications:', err);
    const el = document.getElementById('pubList');
    if (el) el.innerHTML = '<p style="color:#e53e3e;padding:2rem">Could not load publications.</p>';
  }
}

function updateMetrics(metrics, lastUpdated) {
  if (!metrics) return;
  const el = (id, val) => { const e=document.getElementById(id); if(e){e.dataset.count=val; e.textContent=val.toLocaleString();} };
  el('totalCitations', metrics.citations);
  el('hIndex',         metrics.h_index);
  el('i10Index',       metrics.i10_index);
  el('pubCountMetric', allPubs.length);
  const lu = document.getElementById('lastUpdated');
  if (lu && lastUpdated) {
    const d = new Date(lastUpdated);
    lu.textContent = d.toLocaleDateString('en-US',{year:'numeric',month:'long'});
  }
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  if (isNaN(target)) return;
  const start = performance.now();
  const ease  = t => 1 - Math.pow(1-t, 3);
  const tick  = now => {
    const p = Math.min((now-start)/1500, 1);
    el.textContent = Math.round(ease(p)*target).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function animateCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ animateCounter(e.target); obs.unobserve(e.target); } });
  }, { threshold:0.3 });
  $$('.metric-value').forEach(el => obs.observe(el));
}

function getFilteredSorted() {
  let pubs = [...allPubs];
  if (activeFilter !== 'all') pubs = pubs.filter(p => p.type === activeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    pubs = pubs.filter(p =>
      p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q)  || String(p.year).includes(q));
  }
  if (activeSort==='citations') pubs.sort((a,b)=>(b.citations||0)-(a.citations||0));
  else if (activeSort==='year') pubs.sort((a,b)=>b.year-a.year);
  else if (activeSort==='title') pubs.sort((a,b)=>a.title.localeCompare(b.title));
  return pubs;
}

const typeLabel  = t => ({journal:'Journal Article',conference:'Conference Paper',book:'Book Chapter'}[t]||t);
const typeClass  = t => ({journal:'badge-type-journal',conference:'badge-type-conference',book:'badge-type-book'}[t]||'');
const qClass     = q => !q?'':q==='Q1'?'badge-q1':q==='Q2'?'badge-q2':q==='Q3'?'badge-q3':'badge-indexed';

function renderPublications() {
  const list  = document.getElementById('pubList');
  const empty = document.getElementById('pubEmpty');
  const preview = siteContent?.publication_preview || {};
  let pubs = allPubs;
  const countLimit = Number(preview.count) || 0;

  if (Array.isArray(preview.selected_ids) && preview.selected_ids.length) {
    const selectedIds = preview.selected_ids.map(id => Number(id));
    pubs = allPubs.filter(pub => selectedIds.includes(pub.id));
    pubs = pubs.sort((a,b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
    if (activeFilter !== 'all') pubs = pubs.filter(pub => pub.type === activeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      pubs = pubs.filter(pub =>
        pub.title.toLowerCase().includes(q) || pub.authors.toLowerCase().includes(q) ||
        pub.venue.toLowerCase().includes(q) || String(pub.year).includes(q));
    }
  } else {
    pubs = getFilteredSorted();
  }

  if (countLimit > 0) {
    pubs = pubs.slice(0, countLimit);
  }

  const footer = document.getElementById('pubFooter');
  if (!pubs.length) {
    const noData = Array.isArray(preview.selected_ids) && preview.selected_ids.length
      ? '<p>No selected publications are available.</p>'
      : '<p>No publications found matching your search.</p>';
    list.innerHTML = '';
    empty.innerHTML = noData;
    empty.style.display='block';
    if (footer) footer.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  if (footer) footer.innerHTML = '';
  list.innerHTML = pubs.map((pub,i) => `
    <div class="pub-item" data-type="${esc(pub.type)}" style="animation-delay:${i*.03}s">
      <div class="pub-rank"><span class="pub-rank-num">${i+1}</span></div>
      <div class="pub-body">
        <div class="pub-title">${esc(pub.title)}</div>
        <div class="pub-authors">${highlightAuthor(pub.authors)}</div>
        <div class="pub-venue">${esc(pub.venue)}${pub.volume?' '+esc(pub.volume):''}</div>
        <div class="pub-meta">
          <span class="pub-badge badge-year">${pub.year}</span>
          <span class="pub-badge ${typeClass(pub.type)}">${typeLabel(pub.type)}</span>
          ${pub.quartile?`<span class="pub-badge ${qClass(pub.quartile)}">${esc(pub.quartile)}${pub.impact_factor?` · IF ${esc(pub.impact_factor)}`:''}</span>`:''}
          ${pub.indexed?`<span class="pub-badge badge-indexed">${esc(pub.indexed)}</span>`:''}
        </div>
      </div>
      <div class="pub-citations">
        <i class="fas fa-quote-left citation-icon"></i>
        <span class="citation-count">${(pub.citations||0).toLocaleString()}</span>
        <span class="citation-label">Citations</span>
      </div>
    </div>`).join('');

  if (footer) {
    footer.innerHTML = preview.message
      ? `<p>${esc(preview.message)} ${preview.scholar_url ? `<a href="${esc(preview.scholar_url)}" target="_blank" rel="noopener">View on Google Scholar</a>` : ''}</p>`
      : '';
  }
}

function updateTabBadge(count) {
  const b = document.getElementById('pubCount');
  if (b) b.textContent = count;
}

/* ════════════════════════════════════════════════════════════
   SUPERVISION
════════════════════════════════════════════════════════════ */
async function loadSupervisionData() {
  try {
    supervisionData = await fetchData('assets/data/supervision.json');
    renderSupervision();
    updateSupBadges();
  } catch(err) { console.error('Failed to load supervision:', err); }
}

function updateSupBadges() {
  if (!supervisionData) return;
  const pb = document.querySelector('.sup-tab-btn[data-suptab="phd"] .tab-badge');
  const fb = document.querySelector('.sup-tab-btn[data-suptab="fyp"] .tab-badge');
  if (pb) pb.textContent = supervisionData.phd.length;
  if (fb) fb.textContent = supervisionData.fyp.length;
}

function renderSupervision() {
  if (!supervisionData) return;
  renderPhd(); renderMasters(); renderFyp();
}

function renderPhd() {
  const c = document.getElementById('phdGrid');
  if (!c) return;
  if (!supervisionData.phd.length) {
    c.innerHTML = '<div class="coming-soon"><i class="fas fa-user-clock"></i><h3>No PhD students yet</h3></div>';
    return;
  }
  c.innerHTML = supervisionData.phd.map(s => `
    <div class="student-card phd-card">
      <div class="student-header">
        <div class="student-avatar phd-avatar"><i class="fas fa-user-graduate"></i></div>
        <div class="student-title-block">
          <h3>${esc(s.name)}</h3>
          <span class="student-degree">${esc(s.degree||'Ph.D. Candidate')}</span>
        </div>
        <span class="student-status-badge ${esc(s.status)}">${s.status==='current'?'Current':'Graduated'}</span>
      </div>
      <div class="student-details">
        ${s.university?`<div class="student-detail-item"><i class="fas fa-university"></i><span>${esc(s.university)}</span></div>`:''}
        ${s.role?`<div class="student-detail-item"><i class="fas fa-user-tie"></i><span>Role: <strong>${esc(s.role)}</strong></span></div>`:''}
        ${s.research_area?`<div class="student-detail-item"><i class="fas fa-flask"></i><span>${esc(s.research_area)}</span></div>`:''}
        ${s.thesis?`<div class="student-detail-item"><i class="fas fa-book"></i><span><strong>${esc(s.thesis)}</strong></span></div>`:''}
      </div>
    </div>`).join('');
}

function renderMasters() {
  const c = document.getElementById('mastersGrid');
  if (!c) return;
  if (!supervisionData.masters?.length) {
    c.innerHTML = '<div class="coming-soon"><i class="fas fa-user-clock"></i><h3>Master Students</h3><p>Details will be added soon.</p></div>';
    return;
  }
  c.innerHTML = `<div class="students-grid">`+supervisionData.masters.map(s=>`
    <div class="student-card phd-card">
      <div class="student-header">
        <div class="student-avatar phd-avatar"><i class="fas fa-graduation-cap"></i></div>
        <div class="student-title-block">
          <h3>${esc(s.name)}</h3>
          <span class="student-degree">${esc(s.degree||"Master's Candidate")}</span>
        </div>
        <span class="student-status-badge ${esc(s.status)}">${s.status==='current'?'Current':'Graduated'}</span>
      </div>
      <div class="student-details">
        ${s.university?`<div class="student-detail-item"><i class="fas fa-university"></i><span>${esc(s.university)}</span></div>`:''}
        ${s.role?`<div class="student-detail-item"><i class="fas fa-user-tie"></i><span>Role: <strong>${esc(s.role)}</strong></span></div>`:''}
        ${s.research_area?`<div class="student-detail-item"><i class="fas fa-flask"></i><span>${esc(s.research_area)}</span></div>`:''}
      </div>
    </div>`).join('')+`</div>`;
}

function renderFyp() {
  const c = document.getElementById('fypGrid');
  if (!c || !supervisionData) return;
  const all      = supervisionData.fyp;
  const filtered = fypStatusFilter==='all' ? all : all.filter(s=>s.status===fypStatusFilter);
  $$('.fyp-filter-btn').forEach(btn => {
    const ct = btn.querySelector('.filter-count');
    if (!ct) return;
    const st = btn.dataset.fypstatus;
    ct.textContent = st==='all' ? all.length : all.filter(s=>s.status===st).length;
  });
  if (!filtered.length) { c.innerHTML='<p style="color:var(--text-muted);padding:2rem 0">No students match this filter.</p>'; return; }
  c.innerHTML = filtered.map(s=>`
    <div class="student-card fyp-card" data-fypstatus="${esc(s.status)}">
      <div class="student-header">
        <div class="student-avatar fyp-avatar ${esc(s.status)}">
          <i class="fas ${s.status==='completed'?'fa-check-circle':'fa-spinner'}"></i>
        </div>
        <div class="student-title-block">
          <h3>${esc(s.name)}</h3>
          <span class="student-degree">Final Year Project</span>
        </div>
        <span class="student-status-badge ${esc(s.status)}">${s.status==='current'?'Current':'Completed'}</span>
      </div>
      <div class="student-details">
        <div class="student-detail-item"><i class="fas fa-project-diagram"></i><span>Title: <strong>${esc(s.title)}</strong></span></div>
        <div class="student-detail-item"><i class="fas fa-user-tie"></i><span>Role: <strong>${esc(s.role)}</strong></span></div>
      </div>
    </div>`).join('');
}

/* ════════════════════════════════════════════════════════════
   MEDIA
════════════════════════════════════════════════════════════ */
async function loadMediaData() {
  try {
    const data = await fetchData('assets/data/media.json');
    mediaData = data.items || [];
    renderMedia();
  } catch(err) { console.error('Failed to load media:', err); }
}

const SOCIAL_META = {
  linkedin:  { icon: 'fab fa-linkedin',  label: 'LinkedIn',  btnClass: 'linkedin' },
  facebook:  { icon: 'fab fa-facebook',  label: 'Facebook',  btnClass: 'facebook' },
  instagram: { icon: 'fab fa-instagram', label: 'Instagram', btnClass: 'instagram' },
};

function renderMedia() {
  const grid  = document.getElementById('mediaGrid');
  const empty = document.getElementById('mediaEmpty');
  if (!grid) return;
  const visible = mediaData.filter(i => !i.hidden);
  const items = mediaFilter==='all' ? visible : visible.filter(i=>i.type===mediaFilter);
  if (!items.length) { grid.innerHTML=''; if(empty) empty.style.display='block'; return; }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = items.map(item => {
    if (item.type==='video') {
      const vid   = getYTId(item.url);
      const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '';
      return `
        <div class="media-card" data-type="video">
          <div class="media-thumb video-thumb" onclick="openVideo('${esc(item.url)}')">
            ${thumb?`<img src="${thumb}" alt="${esc(item.title)}" loading="lazy">`:'<div class="media-placeholder"><i class="fas fa-video"></i></div>'}
            <div class="media-play-btn"><i class="fas fa-play"></i></div>
          </div>
          <div class="media-info">
            <h4>${esc(item.title)}</h4>
            ${item.description?`<p>${item.description}</p>`:''}
            <div class="media-meta">
              ${item.date?`<span class="media-date"><i class="fas fa-calendar-alt"></i> ${esc(item.date)}</span>`:''}
              <span class="media-type-badge video"><i class="fas fa-video"></i> Video</span>
            </div>
          </div>
        </div>`;
    }
    if (item.type==='social') {
      const m = SOCIAL_META[item.platform] || { icon:'fas fa-share-alt', label: item.platform||'Social', btnClass:'linkedin' };
      const thumbHtml = item.image_url
        ? `<img src="${esc(item.image_url)}" alt="${esc(item.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">
           <div style="position:absolute;top:.4rem;right:.4rem"><i class="${m.icon} social-platform-icon ${esc(item.platform)}" style="font-size:1.2rem;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))"></i></div>
           <span class="social-view-btn ${m.btnClass}" style="position:absolute;bottom:.5rem;right:.5rem"><i class="fas fa-external-link-alt"></i> View Post</span>`
        : `<i class="${m.icon} social-platform-icon ${esc(item.platform)}"></i>
           <span class="social-platform-label">${m.label}</span>
           <span class="social-view-btn ${m.btnClass}"><i class="fas fa-external-link-alt"></i> View Post</span>`;
      return `
        <div class="media-card social" data-type="social">
          <a class="media-thumb" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="position:relative">
            ${thumbHtml}
          </a>
          <div class="media-info">
            <h4>${esc(item.title)}</h4>
            ${item.description?`<p>${item.description}</p>`:''}
            <div class="media-meta">
              ${item.date?`<span class="media-date"><i class="fas fa-calendar-alt"></i> ${esc(item.date)}</span>`:''}
              <span class="media-type-badge social"><i class="fas fa-share-alt"></i> ${m.label}</span>
            </div>
          </div>
        </div>`;
    }
    if (item.type === 'album') {
      const assets = item.assets||[];
      const thumbs = assets.slice(0,4);
      const mosaic = thumbs.map((a, ai) => {
        if (a.type==='video') {
          const vid = getYTId(a.url);
          const t = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '';
          return `<div class="alb-cell" onclick="openAlbumAsset(${items.indexOf(item)},${ai})" style="cursor:pointer;position:relative">
            ${t?`<img src="${t}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">`:'<div style="width:100%;height:100%;background:#111;display:flex;align-items:center;justify-content:center"><i class="fab fa-youtube" style="color:#ff0000;font-size:1.2rem"></i></div>'}
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25)"><i class="fas fa-play" style="color:#fff;font-size:.7rem"></i></div>
          </div>`;
        }
        return `<div class="alb-cell" onclick="openAlbumAsset(${items.indexOf(item)},${ai})" style="cursor:pointer">
          <img src="${esc(a.url)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">
        </div>`;
      }).join('');
      const extra = assets.length > 4 ? `<div class="alb-cell alb-more">+${assets.length-4}</div>` : '';
      return `
        <div class="media-card" data-type="album">
          <div class="media-thumb alb-mosaic">${mosaic}${extra}</div>
          <div class="media-info">
            <h4>${esc(item.title)}</h4>
            ${item.description?`<p>${item.description}</p>`:''}
            <div class="media-meta">
              ${item.date?`<span class="media-date"><i class="fas fa-calendar-alt"></i> ${esc(item.date)}</span>`:''}
              <span class="media-type-badge image"><i class="fas fa-images"></i> Album · ${assets.length}</span>
            </div>
          </div>
        </div>`;
    }
    return `
      <div class="media-card" data-type="image">
        <div class="media-thumb" onclick="openLightbox('${esc(item.url)}','${esc(item.title)}')">
          <img src="${esc(item.url)}" alt="${esc(item.title)}" loading="lazy">
          <div class="media-zoom-btn"><i class="fas fa-search-plus"></i></div>
        </div>
        <div class="media-info">
          <h4>${esc(item.title)}</h4>
          ${item.description?`<p>${item.description}</p>`:''}
          <div class="media-meta">
            ${item.date?`<span class="media-date"><i class="fas fa-calendar-alt"></i> ${esc(item.date)}</span>`:''}
            <span class="media-type-badge image"><i class="fas fa-image"></i> Image</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

function getYTId(url) {
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
  const vid = getYTId(url);
  if (!vid) { window.open(url,'_blank'); return; }
  const vm = document.getElementById('videoModal');
  if (!vm) return;
  vm.querySelector('iframe').src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
  vm.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const vm = document.getElementById('videoModal');
  if (lb) lb.style.display = 'none';
  if (vm) { vm.style.display='none'; vm.querySelector('iframe').src=''; }
  document.body.style.overflow = '';
}

function openAlbumAsset(itemIdx, assetIdx) {
  const visible = mediaData.filter(i => !i.hidden);
  const filtered = mediaFilter==='all' ? visible : visible.filter(i=>i.type===mediaFilter);
  const item = filtered[itemIdx];
  if (!item || item.type !== 'album') return;
  const asset = (item.assets||[])[assetIdx];
  if (!asset) return;
  if (asset.type === 'video') {
    openVideo(asset.url);
  } else {
    openLightbox(asset.url, asset.caption || item.title);
  }
}

/* ════════════════════════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════════════════════════ */
function initTabs() {
  const btns     = $$('.tab-btn');
  const contents = $$('.tab-content');
  const valid    = ['about','teaching','supervision','publications','media','cv'];

  function activate(tabId) {
    if (!valid.includes(tabId)) tabId = 'about';
    btns.forEach(b     => b.classList.toggle('active', b.dataset.tab===tabId));
    contents.forEach(c => c.classList.toggle('active', c.id===`tab-${tabId}`));
    $$('.nav-link[data-tab]').forEach(l => l.classList.toggle('active', l.dataset.tab===tabId));
    history.replaceState(null,'',`#${tabId}`);
    const nav = document.getElementById('tabNav');
    if (nav) window.scrollTo({top:nav.offsetTop-64, behavior:'smooth'});
    if (tabId==='publications') renderPublications();
  }

  btns.forEach(btn => btn.addEventListener('click', ()=>activate(btn.dataset.tab)));
  $$('.nav-link[data-tab]').forEach(link => {
    link.addEventListener('click', e=>{ e.preventDefault(); activate(link.dataset.tab); });
  });
  const hash = location.hash.replace('#','');
  if (valid.includes(hash)) activate(hash);
}

/* ── Section Nav ── */
function initSectionNav() {
  const btns   = $$('.snav-btn');
  const panels = $$('.section-panel');
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b   => b.classList.toggle('active', b.dataset.section===btn.dataset.section));
    panels.forEach(p => p.classList.toggle('active', p.id===`section-${btn.dataset.section}`));
    const bar = document.querySelector('.section-nav-bar');
    if (bar) window.scrollTo({top: bar.getBoundingClientRect().top+window.scrollY-70, behavior:'smooth'});
  }));
}

/* ── Experience Filter ── */
function initExpFilter() {
  $$('.exp-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.exp-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      expFilter = btn.dataset.expcat;
      renderExperience();
    });
  });
}

/* ── Teaching Filter ── */
function initTeachingFilter() {
  $$('.tfilter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tfilter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.tcat;
      $$('.subject-card').forEach(card => {
        card.style.display = (cat==='all'||card.dataset.tcat===cat) ? '' : 'none';
      });
    });
  });
}

/* ── Supervision Tabs ── */
function initSupervisionTabs() {
  $$('.sup-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.sup-tab-btn').forEach(b  => b.classList.remove('active'));
      $$('.suptab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const el = document.getElementById(`suptab-${btn.dataset.suptab}`);
      if (el) el.classList.add('active');
    });
  });
}

/* ── FYP Filter ── */
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

/* ── Publications Controls ── */
function initControls() {
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderPublications();
    });
  });
  const si = document.getElementById('pubSearch');
  if (si) si.addEventListener('input', () => { searchQuery=si.value.trim(); renderPublications(); });
  const ss = document.getElementById('pubSort');
  if (ss) ss.addEventListener('change', () => { activeSort=ss.value; renderPublications(); });
}

/* ── Media Filter ── */
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

/* ── Mobile Nav ── */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', ()=>links.classList.toggle('open'));
    $$('.nav-link').forEach(l=>l.addEventListener('click',()=>links.classList.remove('open')));
  }
}

/* ── Sticky Nav shadow ── */
function initStickyNav() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', ()=>{
    navbar.style.boxShadow = window.scrollY>10
      ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 16px rgba(0,0,0,0.18)';
  }, {passive:true});
}

/* ── Keyboard ── */
document.addEventListener('keydown', e => { if(e.key==='Escape') closeLightbox(); });

/* ════════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════════ */
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
  loadSiteContent();
  loadSupervisionData();
  loadMediaData();
});
