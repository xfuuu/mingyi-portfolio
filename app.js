// Small helper: get query params
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

const state = {
  data: [],
  newest: null
};

async function loadData(){
  try{
    const res = await fetch('data.json', {cache:'no-cache'});
    state.data = await res.json();
    // newest: either explicit featured or latest by year
    state.newest = state.data.find(d => d.featured) || [...state.data].sort((a,b)=>(b.year||0)-(a.year||0))[0];
  }catch(e){
    console.error('Failed to load data.json', e);
    // Fallback for file:// usage — use boot data embedded in HTML
    if (window.__BOOT_DATA__) {
      state.data = window.__BOOT_DATA__;
      state.newest = state.data.find(d => d.featured) || [...state.data].sort((a,b)=>(b.year||0)-(a.year||0))[0];
    }
  }
}

function fmtPrice(p){
  if (p === null || p === undefined || p === '') return '—';
  return typeof p === 'number' ? `$${p.toLocaleString()}` : p;
}

function renderFeatured(){
  const wrap = $('#featuredWork');
  if (!wrap || !state.newest) return;
  const w = state.newest;
  wrap.innerHTML = `
    <article class="featured-card">
      <img src="${w.thumbnail}" alt="${w.title}" loading="eager" decoding="async">
      <div class="meta">
        <h3>${w.title}</h3>
        <div class="small">${w.medium || ''} ${w.year ? '· '+w.year : ''} ${w.dimensions ? '· '+w.dimensions : ''}</div>
        <div class="price">${fmtPrice(w.price)} ${w.available ? '(Available)' : ''}</div>
        <div class="badges" style="margin:10px 0">
          <span class="badge">${w.category}</span>
          ${w.available ? '<span class="badge">available</span>' : '<span class="badge">sold</span>'}
        </div>
        <a class="btn primary" href="detail.html?id=${encodeURIComponent(w.id)}">View Work</a>
      </div>
    </article>
  `;
}

function renderGrid(){
  const grid = $('#grid');
  if(!grid) return;
  const q = ($('#search')?.value || '').toLowerCase();
  const activeFilter = $('.chip.active')?.dataset.filter || 'all';
  const sortBy = $('#sortBy')?.value || 'new';

  let items = [...state.data];

  // filters
  items = items.filter(it => {
    const text = (it.title + ' ' + (it.medium||'') + ' ' + (it.year||'')).toLowerCase();
    const matchesSearch = !q || text.includes(q);
    const matchesType = activeFilter === 'all' ||
                        (activeFilter === 'available' ? it.available : it.category === activeFilter);
    return matchesSearch && matchesType;
  });

  // sort
  items.sort((a,b)=>{
    if (sortBy === 'new') return (b.year||0) - (a.year||0);
    if (sortBy === 'old') return (a.year||0) - (b.year||0);
    if (sortBy === 'priceH') return (b.price||0) - (a.price||0);
    if (sortBy === 'priceL') return (a.price||0) - (b.price||0);
    return 0;
  });

  grid.innerHTML = items.map(w => {
    // Use thumbnail for gallery grid (fast loading)
    // Try optimized thumbnail first, fallback to original
    const thumbPath = w.thumbnail || w.images?.[0] || '';
    // Check if optimized thumbnail path exists (will be set in data.json)
    const optimizedThumb = thumbPath.replace(/assets\/(artworks|photography)\//, 'assets/optimized/$1/thumbs/');
    // Use optimized if available, otherwise use original
    const finalThumb = w.optimizedThumbnail || optimizedThumb || thumbPath;
    // Compute non-optimized thumbs dir fallback and original as last resort
    const nonOptimizedThumb = thumbPath.replace(/assets\/(artworks|photography)\//, 'assets/$1/thumbs/');
    
    return `
    <div class="card" data-artwork-id="${w.id}" style="cursor: pointer;">
      <img class="thumb" src="${finalThumb}" alt="${w.title}" loading="lazy" decoding="async"
           onerror="if(this.dataset.fbk!=='1'){this.dataset.fbk='1'; this.src='${nonOptimizedThumb}';}else{this.onerror=null; this.src='${thumbPath}';}">
      <div class="info">
        <div class="title">${w.title}</div>
        <div class="muted">${w.medium || ''} ${w.year ? '· '+w.year : ''}</div>
        <div class="badges">
          <span class="badge">${w.category}</span>
          ${w.available ? '<span class="badge">available</span>' : ''}
          ${w.price ? '<span class="badge">' + fmtPrice(w.price) + '</span>' : ''}
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function renderDetail(){
  const el = $('#workDetail');
  if(!el) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const w = state.data.find(x => String(x.id) === String(id));
  if(!w){
    el.innerHTML = '<p>Work not found.</p>';
    return;
  }
  // Use high-quality version for detail page
  const fullImagePath = w.images?.[0] || w.thumbnail || '';
  const optimizedFull = w.optimizedImage || fullImagePath.replace(/assets\/(artworks|photography)\//, 'assets/optimized/$1/');
  el.innerHTML = `
    <div class="media">
      <img src="${optimizedFull}" alt="${w.title}" loading="eager" decoding="async"
           onerror="this.onerror=null; this.src='${fullImagePath}'">
    </div>
    <div class="work-meta">
      <h1>${w.title}</h1>
      <div class="muted">${w.year || ''}</div>
      <p>${w.description || ''}</p>
      <p><strong>Medium:</strong> ${w.medium || '—'}</p>
      ${w.dimensions ? `<p><strong>Dimensions:</strong> ${w.dimensions}</p>` : ''}
      <p><strong>Price:</strong> <span class="price">${fmtPrice(w.price)}</span> ${w.available ? '(Available)' : '(Sold/Unavailable)'}</p>
      <div class="badges">
        <span class="badge">${w.category}</span>
        ${w.available ? '<span class="badge">available</span>' : ''}
      </div>
      <div style="display:flex; gap:8px; margin-top:12px">
        <a class="btn primary" href="mailto:www@jeremyartcom.com?subject=${encodeURIComponent('Inquiry: '+w.title)}">Inquire</a>
        <a class="btn" href="gallery.html">Back to Gallery</a>
      </div>
    </div>
  `;
}

function wireGalleryControls(){
  $$('#sortBy, #search').forEach(el => el?.addEventListener('input', renderGrid));
  $$('.chip').forEach(chip => chip.addEventListener('click', ()=>{
    $$('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    renderGrid();
  }));
}

function applyHashFilter(){
  const grid = $('#grid');
  if(!grid) return; // only run on gallery page
  const hash = (location.hash || '#all').slice(1).toLowerCase();
  const map = { paintings:'painting', painting:'painting', photography:'photography', photos:'photography', available:'available', all:'all' };
  const filter = map[hash] || 'all';
  const chip = document.querySelector(`.chip[data-filter="${filter}"]`);
  if (chip){
    $$('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
  }
  renderGrid();
}

function wireHeroSound(){
  const btn = $('#toggleSound');
  const v = $('#heroVideo');
  if(!btn || !v) return;
  btn.addEventListener('click', ()=>{
    v.muted = !v.muted;
    btn.textContent = v.muted ? 'Unmute' : 'Mute';
    if(!v.paused) v.play().catch(()=>{});
  });
}

function setYear(){
  const y = new Date().getFullYear();
  $$('#year').forEach(n => n.textContent = y);
}

function fixMobileVideoHeight(){
  // Fix mobile video height issues
  const studio = $('.studio');
  if(!studio) return;
  
  function updateVideoHeight(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Force video container to full height
    if(window.innerWidth <= 768){
      studio.style.height = `${window.innerHeight}px`;
    }
  }
  
  // Update on load and resize
  updateVideoHeight();
  window.addEventListener('resize', updateVideoHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(updateVideoHeight, 100);
  });
}

function wireArtworkModal(){
  const modal = $('#artworkModal');
  const closeBtn = $('#closeArtworkModal');
  const closeBtn2 = $('#closeArtworkModalBtn');
  
  if(!modal) return;

  // Open modal when clicking on artwork cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card[data-artwork-id]');
    if(card){
      const artworkId = card.dataset.artworkId;
      openArtworkModal(artworkId);
    }
  });

  // Close modal functions
  function closeModal(){
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  closeBtn?.addEventListener('click', closeModal);
  closeBtn2?.addEventListener('click', closeModal);
  
  // Close when clicking outside modal
  modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && modal.style.display === 'block') closeModal();
  });
}

function openArtworkModal(artworkId){
  const artwork = state.data.find(w => w.id === artworkId);
  if(!artwork) return;

  const modal = $('#artworkModal');
  if(!modal) return;

  // Populate modal content
  // Use high-quality version for modal (clear display)
  const modalImg = $('#modalArtworkImage');
  const fullImagePath = artwork.images?.[0] || artwork.thumbnail || '';
  // Use optimized high-quality version if available, otherwise use original
  const optimizedFull = artwork.optimizedImage || fullImagePath.replace(/assets\/(artworks|photography)\//, 'assets/optimized/$1/');
  modalImg.src = optimizedFull;
  modalImg.alt = artwork.title;
  modalImg.loading = 'eager';  // Load immediately for modal
  modalImg.decoding = 'async';
  modalImg.onerror = () => {
    modalImg.onerror = null;
    modalImg.src = fullImagePath;
  };
  $('#modalArtworkTitle').textContent = artwork.title;
  $('#modalArtworkYear').textContent = artwork.year || '';
  $('#modalArtworkDescription').textContent = artwork.description || '';
  $('#modalArtworkMedium').textContent = artwork.medium || '—';
  
  const dimensionsEl = $('#modalArtworkDimensions');
  if(artwork.dimensions){
    dimensionsEl.innerHTML = `<strong>Dimensions:</strong> ${artwork.dimensions}`;
    dimensionsEl.style.display = 'block';
  } else {
    dimensionsEl.style.display = 'none';
  }
  
  $('#modalArtworkPrice').textContent = fmtPrice(artwork.price);
  $('#modalArtworkAvailability').textContent = artwork.available ? '(Available)' : '(Sold/Unavailable)';

  // Create badges
  const badgesEl = $('#modalArtworkBadges');
  badgesEl.innerHTML = `
    <span class="badge">${artwork.category}</span>
    ${artwork.available ? '<span class="badge">available</span>' : ''}
  `;

  // Set inquire button
  const inquireBtn = $('#modalInquireBtn');
  inquireBtn.href = `mailto:www@jeremyartcom.com?subject=${encodeURIComponent('Inquiry: ' + artwork.title)}`;

  // Add buy now button if artwork is available
  if (artwork.available && artwork.price) {
    addBuyButton(artwork);
  }

  // Show modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function wireContactModal(){
  const modal = $('#contactModal');
  const btn = $('#contactBtn');
  const closeBtn = $('.close', modal);
  
  if (!modal || !btn) return;
  
  // Open modal
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  });
  
  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Close when clicking outside modal
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
  
  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}

// Bootstrap per-page
(async function init(){
  await loadData();
  renderFeatured();
  renderGrid();
  renderDetail();
  wireGalleryControls();
  applyHashFilter();
  wireHeroSound();
  wireContactModal();
  wireArtworkModal();
  setYear();
  fixMobileVideoHeight();
  window.addEventListener('hashchange', applyHashFilter);
})();
