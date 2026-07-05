/**
 * gallery.js - Dynamic Gallery Loader for IKKSU Sorong Raya
 */

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
}

function sortAlbums(albums) {
  return albums.slice().sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
}

let lightboxState = null;
let lightboxKeyHandler = null;

function closeLightbox() {
  if (!lightboxState) return;
  lightboxState.container.classList.remove('active');
  if (lightboxKeyHandler) {
    document.removeEventListener('keydown', lightboxKeyHandler);
    lightboxKeyHandler = null;
  }
  lightboxState = null;
  document.body.style.overflow = '';
}

function openLightbox(imgSrc, images, currentIndex) {
  const container = document.getElementById('gallery-lightbox');
  if (!container) return;

  const img = container.querySelector('img');
  const prevBtn = container.querySelector('.lb-prev');
  const nextBtn = container.querySelector('.lb-next');
  const closeBtn = container.querySelector('.lb-close');
  const counter = container.querySelector('.lb-counter');

  lightboxState = { container, images, currentIndex };

  function show(index) {
    if (!lightboxState) return;
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    lightboxState.currentIndex = index;
    img.src = images[index];
    if (counter) counter.textContent = `${index + 1} / ${images.length}`;
    if (prevBtn) prevBtn.style.display = images.length > 1 ? '' : 'none';
    if (nextBtn) nextBtn.style.display = images.length > 1 ? '' : 'none';
  }

  show(currentIndex);

  lightboxKeyHandler = (e) => {
    if (!lightboxState) return;
    if (e.key === 'Escape') { closeLightbox(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(lightboxState.currentIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(lightboxState.currentIndex + 1); }
  };

  document.addEventListener('keydown', lightboxKeyHandler);

  container.classList.add('active');
  document.body.style.overflow = 'hidden';

  container.onclick = (e) => {
    if (e.target === container || e.target === img) {
      closeLightbox();
    }
  };

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeLightbox();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      show(lightboxState.currentIndex - 1);
    };
  }
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      show(lightboxState.currentIndex + 1);
    };
  }

  let touchStartX = 0;
  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  container.addEventListener('touchend', (e) => {
    if (!lightboxState) return;
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      show(lightboxState.currentIndex + (diff > 0 ? 1 : -1));
    }
  }, { passive: true });
}

async function loadGallery() {
  const galleryContainer = document.getElementById('dynamic-gallery');
  if (!galleryContainer) return;

  try {
    const response = await fetch(`albums.json?t=${Date.now()}`);
    const albums = sortAlbums(await response.json());

    galleryContainer.innerHTML = '';

    for (const album of albums) {
      const albumCard = await createAlbumCard(album);
      galleryContainer.appendChild(albumCard);

      if (window.revealObserver) {
        window.revealObserver.observe(albumCard);
      }
    }
  } catch (error) {
    console.error('Error loading albums:', error);
    galleryContainer.innerHTML = '<p class="error-msg">Gagal memuat galeri. Silakan coba lagi nanti.</p>';
  }
}

async function createAlbumCard(album) {
  let albumName = album.id;
  let albumLink = '#';
  let albumDesc = '';

  const encodedPath = encodeURI(album.path);

  try {
    const res = await fetch(`${encodedPath}readme.txt`);
    const text = await res.text();

    const nameMatch = text.match(/Album Name:\s*(.*)/i);
    const linkMatch = text.match(/Link:\s*(.*)/i);
    const descMatch = text.match(/Description:\s*(.*)/i);

    if (nameMatch) albumName = nameMatch[1].trim();
    if (linkMatch) albumLink = linkMatch[1].trim();
    if (descMatch) albumDesc = descMatch[1].trim();
  } catch (e) {
    console.warn(`Could not load readme.txt for ${album.id}`);
  }

  const card = document.createElement('div');
  card.className = 'album-card reveal';
  const albumId = `album-${album.id}`;
  card.id = albumId;

  const dateLabel = album.date ? formatDate(album.date) : '';
  const hasHighlights = album.highlights && album.highlights.length > 0;

  let highlightsHtml = '';
  if (hasHighlights) {
    album.highlights.forEach((img, idx) => {
      const imgSrc = `${encodedPath}${encodeURI(img)}`;
      highlightsHtml += `
        <div class="highlight-item" data-index="${idx}">
          <img src="${imgSrc}" alt="${albumName}" loading="lazy">
        </div>
      `;
    });
  }

  card.innerHTML = `
    <div class="album-content">
      <div class="album-header">
        <div class="album-title-row">
          <h3>${albumName}</h3>
          <div class="album-header-actions">
            ${dateLabel ? `<span class="album-date">${dateLabel}</span>` : ''}
            <a href="#${albumId}" class="album-anchor" title="Salin tautan album">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span class="anchor-tooltip">Salin tautan</span>
            </a>
          </div>
        </div>
        ${albumDesc ? `<p class="album-desc">${albumDesc}</p>` : ''}
      </div>
      ${hasHighlights ? `<div class="highlights-grid">${highlightsHtml}</div>` : ''}
      <div class="album-footer">
        <a href="${albumLink}" target="_blank" rel="noopener" class="btn-album">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>
          Lihat Album Lengkap (Google Photos)
          <svg viewBox="0 0 24 24" width="16" height="16" class="btn-arrow"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
    </div>
  `;

  if (hasHighlights) {
    const highlightImgs = album.highlights.map(img => `${encodedPath}${encodeURI(img)}`);
    card.querySelectorAll('.highlight-item').forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index, 10);
        openLightbox(highlightImgs[idx], highlightImgs, idx);
      });
    });
  }

  const anchor = card.querySelector('.album-anchor');
  if (anchor) {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const url = `${window.location.href.split('#')[0]}#${albumId}`;
      navigator.clipboard.writeText(url).then(() => {
        anchor.classList.add('copied');
        const tip = anchor.querySelector('.anchor-tooltip');
        if (tip) tip.textContent = 'Tersalin!';
        setTimeout(() => {
          anchor.classList.remove('copied');
          if (tip) tip.textContent = 'Salin tautan';
        }, 1500);
      });
    });
  }

  return card;
}

async function scrollToAlbum() {
  const hash = window.location.hash;
  if (!hash.startsWith('#album-')) return;
  const el = document.getElementById(hash.slice(1));
  if (el) {
    await new Promise(r => setTimeout(r, 500));
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadGallery().then(scrollToAlbum);
  window.addEventListener('hashchange', scrollToAlbum);
});
