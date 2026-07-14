document.addEventListener('DOMContentLoaded', () => {
    const collectionContainer = document.getElementById('collection-container');
    const selectRating = document.getElementById('select-rating');
    const counterValue = document.getElementById('counter-value');

    /**
     * 1. Cargar y renderizar los álbumes desde el almacenamiento local
     */
    function cargarColeccion() {
        let favoritos = [];

        if (typeof StorageManager !== 'undefined' && typeof StorageManager.getFavorites === 'function') {
            favoritos = StorageManager.getFavorites();
        } else {
            const data = localStorage.getItem('favorites') || '{}';
            favoritos = Object.values(JSON.parse(data));
        }

        const filtroActual = selectRating.value;

        const favoritosFiltrados = favoritos.filter(album => {
            const rating = parseInt(album.rating || 0);
            if (filtroActual === 'all') return true;
            return rating === parseInt(filtroActual);
        });

        counterValue.textContent = favoritosFiltrados.length;

        if (favoritosFiltrados.length === 0) {
            collectionContainer.innerHTML = `
                <div class="state-message">
                    <p>${filtroActual === 'all' 
                        ? 'No has añadido álbumes a tu biblioteca aún.' 
                        : 'No tienes ningún álbum guardado con esta calificación.'}</p>
                </div>
            `;
            return;
        }

        collectionContainer.innerHTML = '';
        
        favoritosFiltrados.forEach(album => {
            const currentRating = parseInt(album.rating || 0);

            // Generar el HTML de las 5 estrellas usando SVG interactivo
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                starsHTML += `
                    <span class="star ${i <= currentRating ? 'star--active' : ''}" data-value="${i}" style="display: inline-flex; align-items: center; cursor: pointer;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </span>
                `;
            }

            const albumArticle = document.createElement('article');
            albumArticle.className = 'album-card';
            
            albumArticle.dataset.id = album.id;
            albumArticle.dataset.title = album.title;
            albumArticle.dataset.cover = album.cover;
            albumArticle.dataset.artist = album.artist;

            albumArticle.innerHTML = `
                <div class="album-header-click" onclick="toggleTracks(${album.id})">
                    <img src="${album.cover}" alt="${album.title}" class="album-cover">
                    <div class="album-details">
                        <h3>${album.title}</h3>
                        <p class="release-date">Artista: ${album.artist || 'Desconocido'}</p>
                        <span class="badge-toggle">
                            Ver canciones 
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-left: 2px;">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </span>
                    </div>
                </div>

                <div class="album-actions-bar">
                    <button class="btn-favorite btn-favorite--active">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg> En favoritos
                    </button>
                    <div class="star-rating">
                        ${starsHTML}
                    </div>
                </div>

                <div id="tracks-container-${album.id}" class="tracks-list-container hidden">
                    <div class="spinner-small hidden">Cargando pistas...</div>
                    <ul class="tracks-list"></ul>
                </div>
            `;

            collectionContainer.appendChild(albumArticle);
        });
    }

    selectRating.addEventListener('change', cargarColeccion);

    collectionContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.album-card');
        if (!card) return;

        const albumData = {
            id: card.dataset.id,
            title: card.dataset.title,
            cover: card.dataset.cover,
            artist: card.dataset.artist
        };

        if (e.target.closest('.btn-favorite')) {
            if (typeof StorageManager !== 'undefined' && typeof StorageManager.toggleFavorite === 'function') {
                StorageManager.toggleFavorite(albumData);
            } else {
                const data = JSON.parse(localStorage.getItem('favorites') || '{}');
                delete data[albumData.id];
                localStorage.setItem('favorites', JSON.stringify(data));
            }
            cargarColeccion();
        }

        if (e.target.classList.contains('star')) {
            const selectedRating = parseInt(e.target.dataset.value);
            
            if (typeof StorageManager !== 'undefined' && typeof StorageManager.updateRating === 'function') {
                StorageManager.updateRating(albumData.id, selectedRating);
            } else {
                const data = JSON.parse(localStorage.getItem('favorites') || '{}');
                if (data[albumData.id]) {
                    data[albumData.id].rating = selectedRating;
                    localStorage.setItem('favorites', JSON.stringify(data));
                }
            }
            cargarColeccion();
        }
    });

    cargarColeccion();
});

/**
 * ==========================================================================
 * LÓGICA DE DESGLOSE GLOBAL DE CANCIONES
 * ==========================================================================
 */
window.toggleTracks = function(albumId) {
    const container = document.getElementById(`tracks-container-${albumId}`);
    if (!container) return;

    const spinner = container.querySelector('.spinner-small');
    const list = container.querySelector('.tracks-list');
    
    const card = container.closest('.album-card');
    const artistName = card ? card.dataset.artist : 'Desconocido';

    const isHidden = container.classList.toggle('hidden');

    if (!isHidden && list.children.length === 0) {
        spinner.classList.remove('hidden');

        const url = `https://corsproxy.io/?${encodeURIComponent(`https://api.deezer.com/album/${albumId}/tracks`)}`;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Error al conectar con Deezer');
                return res.json();
            })
            .then(result => {
                spinner.classList.add('hidden');
                const tracks = result.data || [];

                if (tracks.length === 0) {
                    list.innerHTML = `<li class="track-item-empty">No hay canciones disponibles.</li>`;
                    return;
                }

                list.innerHTML = tracks.map((track, idx) => {
                    const safeTitle = track.title.replace(/'/g, "\\'");
                    
                    return `
                        <li class="track-item" id="track-${track.id}">
                            <span class="track-number">${idx + 1}</span>
                            
                            <button class="btn-play-pill btn-play-track" onclick="playTrack('${track.preview}', '${safeTitle}', '${artistName}', ${track.id})" title="Reproducir">
                                <svg class="play-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </button>

                            <span class="track-name">${track.title}</span>
                            <span class="track-duration">${formatDuration(track.duration)}</span>
                        </li>
                    `;
                }).join('');
            })
            .catch(err => {
                console.error('Error cargando tracks:', err);
                spinner.classList.add('hidden');
                list.innerHTML = `
                    <li class="track-item-error" style="display: flex; align-items: center; gap: 8px; color: #ef4444; padding: 1rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg> 
                        No se pudieron cargar las canciones.
                    </li>
                `;
            });
    }
};

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * ==========================================================================
 * MOTOR DE AUDIO CONECTADO AL REPRODUCTOR DE LA BARRA INFERIOR
 * ==========================================================================
 */
let botonActivoActual = null;

window.playTrack = function(previewUrl, title, artist, trackId) {
    // 1. Intentamos capturar los elementos reales del reproductor en tu DOM
    const audioPlayer = document.getElementById('audio-player') || document.querySelector('audio');
    const textTitle = document.getElementById('player-track-title') || document.getElementById('current-track-title') || document.querySelector('.player-info h4');
    const textArtist = document.getElementById('player-artist-name') || document.getElementById('current-track-artist') || document.querySelector('.player-info p');

    if (!audioPlayer) {
        console.error("No se encontró la etiqueta <audio> en coleccion.html");
        return;
    }

    if (!previewUrl || previewUrl === 'null') {
        alert('Lo siento, Deezer no ofrece vista previa para esta canción.');
        return;
    }

    const botonPresionado = document.querySelector(`#track-${trackId} .btn-play-track`);

    // CASO 1: Si haces clic en la canción que ya está sonando -> Alterna Play / Pausa
    if (audioPlayer.src === previewUrl) {
        if (audioPlayer.paused) {
            audioPlayer.play()
                .then(() => cambaiIconoAReproduciendo(botonPresionado))
                .catch(err => console.error("Error al reanudar:", err));
        } else {
            audioPlayer.pause();
            cambiarIconoAPausa(botonPresionado);
        }
        return;
    }

    // CASO 2: Si cambias a una canción nueva, limpiamos el icono anterior
    if (botonActivoActual) {
        cambiarIconoAPausa(botonActivoActual);
    }

    // 2. Sincronizamos los textos del reproductor inferior inmediatamente
    if (textTitle) textTitle.textContent = title;
    if (textArtist) textArtist.textContent = artist;

    // 3. Le pasamos el archivo de música al reproductor nativo de tu barra
    audioPlayer.src = previewUrl;
    botonActivoActual = botonPresionado;

    audioPlayer.play()
        .then(() => {
            cambaiIconoAReproduciendo(botonPresionado);
        })
        .catch(err => console.error("Fallo al reproducir en barra:", err));

    // 4. Si la canción termina sola, limpiamos la barra limpiamente
    audioPlayer.onended = () => {
        cambiarIconoAPausa(botonPresionado);
        if (textTitle) textTitle.textContent = "Ninguna canción seleccionada";
        if (textArtist) textArtist.textContent = "-";
        botonActivoActual = null;
    };
};

/* Helpers visuales para cambiar los iconos dinámicamente */
function cambaiIconoAReproduciendo(btn) {
    if (!btn) return;
    btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
    `;
}

function cambiarIconoAPausa(btn) {
    if (!btn) return;
    btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>
    `;
}