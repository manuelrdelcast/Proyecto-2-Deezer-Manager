const urlParams = new URLSearchParams(window.location.search);
const artistId = urlParams.get('id');

const artistProfile = document.getElementById('artist-profile');
const albumsContainer = document.getElementById('albums-container');

if (artistId) {
    cargarDetalleArtista(artistId);
} else {
    artistProfile.innerHTML = `<p class="error-msg">Error: No se proporcionó un ID de artista válido.</p>`;
}

async function cargarDetalleArtista(id) {
    try {
        // Usamos las funciones de js/api.js
        const [datosArtista, datosAlbumes] = await Promise.all([
            obtenerDatosArtista(id),
            obtenerAlbumesArtista(id)
        ]);

        if (datosArtista.error) throw new Error(datosArtista.error.message);

        renderizarPerfil(datosArtista);
        renderizarAlbumes(datosAlbumes.data, datosArtista.name);
    } catch (error) {
        console.error(error);
        artistProfile.innerHTML = `<p class="error-msg">Error al cargar datos de Deezer.</p>`;
    }
}

function renderizarPerfil(artista) {
    artistProfile.innerHTML = `
        <div class="artist-card-horizontal">
            <img src="${artista.picture_medium}" alt="${artista.name}" class="artist-img">
            <div class="artist-info-text">
                <h2>${artista.name}</h2>
                <p><strong>Fans:</strong> ${Number(artista.nb_fan).toLocaleString()}</p>
                <p><strong>Total de álbumes:</strong> ${artista.nb_album}</p>
            </div>
        </div>
    `;
}

function renderizarAlbumes(albumes, nombreArtista) {
    if (!albumes || albumes.length === 0) {
        albumsContainer.innerHTML = `<p class="empty-state">Este artista no tiene álbumes.</p>`;
        return;
    }
    
    albumsContainer.innerHTML = '';
    
    albumes.forEach(album => {
        // 1. Consultar estado de favoritos y calificación usando storage.js
        const isFav = StorageManager.isFavorite(album.id);
        const favData = StorageManager.getFavorite(album.id);
        const currentRating = favData ? favData.rating : 0;

        // 2. Generar el HTML de las 5 estrellas usando un SVG con "pointer-events: none" para que no rompa el click de JS
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
        
        // Guardamos los metadatos en el elemento para leerlos al hacer click
        albumArticle.dataset.id = album.id;
        albumArticle.dataset.title = album.title;
        albumArticle.dataset.cover = album.cover_medium;
        albumArticle.dataset.artist = nombreArtista;

        albumArticle.innerHTML = `
            <!-- Encabezado del álbum (Activa/Desactiva canciones de forma nativa) -->
            <div class="album-header-click" onclick="toggleTracks(${album.id})">
                <img src="${album.cover_medium}" alt="${album.title}" class="album-cover">
                <div class="album-details">
                    <h3>${album.title}</h3>
                    <p class="release-date">Lanzamiento: ${album.release_date || 'N/A'}</p>
                    <span class="badge-toggle">
                        Ver canciones 
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-left: 2px;">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </span>
                </div>
            </div>

            <!-- Bloque de Favorito y Calificación (Fuera del click de tracks) -->
            <div class="album-actions-bar">
                <button class="btn-favorite ${isFav ? 'btn-favorite--active' : ''}">
                    ${isFav 
                        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> En favoritos' 
                        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> Añadir a favoritos'}
                </button>
                
                <div class="star-rating ${isFav ? '' : 'star-rating--disabled'}">
                    ${starsHTML}
                </div>
            </div>

            <!-- Contenedor de canciones original -->
            <div id="tracks-container-${album.id}" class="tracks-list-container hidden">
                <div class="spinner-small hidden">Cargando pistas...</div>
                <ul class="tracks-list"></ul>
            </div>
        `;
        
        albumsContainer.appendChild(albumArticle);
    });
}

async function toggleTracks(albumId) {
    const container = document.getElementById(`tracks-container-${albumId}`);
    const listElement = container.querySelector('.tracks-list');
    const spinner = container.querySelector('.spinner-small');

    if (!container.classList.contains('hidden')) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    if (listElement.children.length > 0) return;

    try {
        spinner.classList.remove('hidden');
        // Usamos la función de js/api.js
        const resultado = await obtenerTracksAlbum(albumId);
        spinner.classList.add('hidden');
        renderizarTracks(resultado.data, listElement);
    } catch (error) {
        spinner.classList.add('hidden');
        listElement.innerHTML = `<li>No se pudieron cargar las canciones.</li>`;
    }
}

function renderizarTracks(tracks, listElement) {
    if (!tracks || tracks.length === 0) {
        listElement.innerHTML = `<li>No hay canciones.</li>`;
        return;
    }

    // Limpiamos el contenedor antes de renderizar para evitar duplicados
    listElement.innerHTML = '';

    tracks.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = 'track-item';
        
        const minutos = Math.floor(track.duration / 60);
        const segundos = String(track.duration % 60).padStart(2, '0');
        
        // Controlamos si la API de Deezer devuelve el artista anidado o plano
        const artistName = track.artist && track.artist.name ? track.artist.name : 'Desconocido';

        // Reestructuración con el orden premium: Número -> Botón Píldora -> Nombre -> Duración
        li.innerHTML = `
            <span class="track-number">${index + 1}</span>
            
            <button class="btn-play-pill btn-play-track" data-preview="${track.preview}" data-title="${track.title}" data-artist="${artistName}" title="Reproducir">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
            
            <span class="track-name">${track.title}</span>
            <span class="track-duration">${minutos}:${segundos}</span>
        `;
        listElement.appendChild(li);
    });

    // Escuchador de eventos optimizado con e.currentTarget
    listElement.querySelectorAll('.btn-play-track').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const targetBoton = e.currentTarget; // Asegura capturar el botón y no el SVG interno
            const previewUrl = targetBoton.getAttribute('data-preview');
            const titulo = targetBoton.getAttribute('data-title');
            const artista = targetBoton.getAttribute('data-artist');
            
            // Sigue consumiendo tu lógica global de js/player.js intacta
            reproducirCancion(previewUrl, titulo, artista);
        });
    });
}

// Delegación de eventos para capturar clicks en Favoritos y Estrellas
albumsContainer.addEventListener('click', (e) => {
    // Buscamos la tarjeta de álbum ancestro más cercana
    const card = e.target.closest('.album-card');
    if (!card) return;

    // Extraemos la metadata que configuramos en los dataset
    const albumData = {
        id: card.dataset.id,
        title: card.dataset.title,
        cover: card.dataset.cover,
        artist: card.dataset.artist
    };

    // CASO A: Click en el botón de Favorito
    if (e.target.closest('.btn-favorite')) {
        const btn = e.target.closest('.btn-favorite');
        const isNowFav = StorageManager.toggleFavorite(albumData);
        
        // Actualizamos el botón visualmente con SVGs
        btn.classList.toggle('btn-favorite--active', isNowFav);
        btn.innerHTML = isNowFav 
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> En favoritos' 
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> Añadir a favoritos';
        
        // Bloqueamos o desbloqueamos las estrellas según corresponda
        const ratingContainer = card.querySelector('.star-rating');
        ratingContainer.classList.toggle('star-rating--disabled', !isNowFav);
        
        // Si se elimina de favoritos, reiniciamos las estrellas visualmente
        if (!isNowFav) {
            card.querySelectorAll('.star').forEach(star => star.classList.remove('star--active'));
        }
    }

    // CASO B: Click en una estrella de calificación
    if (e.target.classList.contains('star')) {
        const ratingContainer = card.querySelector('.star-rating');
        
        // Ignorar si el componente está deshabilitado (no es favorito)
        if (ratingContainer.classList.contains('star-rating--disabled')) return;

        const selectedRating = parseInt(e.target.dataset.value);
        StorageManager.updateRating(albumData.id, selectedRating);

        // Pintamos de dorado las estrellas seleccionadas y apagamos las restantes
        const stars = ratingContainer.querySelectorAll('.star');
        stars.forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.classList.toggle('star--active', starValue <= selectedRating);
        });
    }
});