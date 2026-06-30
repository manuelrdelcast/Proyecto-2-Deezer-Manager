document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const stateContainer = document.getElementById('stateContainer');
    let searchTimeout;

    if (searchInput && resultsContainer && stateContainer) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);

            if (query === '') {
                renderEmptyState();
                return;
            }

            renderLoadingState();

            searchTimeout = setTimeout(async () => {
                const results = await fetchArtists(query);
                
                if (results === null) {
                    renderErrorState();
                } else if (results.length === 0) {
                    renderNotFoundState(query);
                } else {
                    renderResults(results);
                }
            }, 500);
        });
    }

    /* --- Funciones de Gestión de Estados --- */
    
    function renderEmptyState() {
        stateContainer.innerHTML = `
            <div class="state-message">
                <h2>¿Qué quieres escuchar hoy?</h2>
                <p>Usa la barra superior para buscar a tus artistas favoritos.</p>
            </div>
        `;
        resultsContainer.innerHTML = '';
    }

    function renderLoadingState() {
        stateContainer.innerHTML = `
            <div class="state-message">
                <span class="btn-spinner" style="border-top-color: var(--primary); border-color: rgba(139, 92, 246, 0.3); width: 2rem; height: 2rem;"></span>
                <p>Buscando artistas...</p>
            </div>
        `;
        resultsContainer.innerHTML = '';
    }

    function renderNotFoundState(query) {
        stateContainer.innerHTML = `
            <div class="state-message">
                <h2>No encontramos a "${query}"</h2>
                <p>Intenta verificar la ortografía o probar con otro término.</p>
            </div>
        `;
        resultsContainer.innerHTML = '';
    }

    function renderErrorState() {
        stateContainer.innerHTML = `
            <div class="state-message">
                <h2>¡Ups! Algo salió mal</h2>
                <p>No pudimos conectar con Deezer. Verifica tu conexión e intenta de nuevo.</p>
            </div>
        `;
        resultsContainer.innerHTML = '';
    }

    function renderResults(artists) {
        stateContainer.innerHTML = ''; 
        resultsContainer.innerHTML = ''; 
        
        artists.forEach(artist => {
            const artistCard = document.createElement('article');
            artistCard.classList.add('artist-card');
            
            artistCard.innerHTML = `
                <img src="${artist.picture_medium}" alt="${artist.name}" class="artist-card__img">
                <div class="artist-card__info">
                    <h3 class="artist-card__name">${artist.name}</h3>
                    <p class="artist-card__fans">${artist.nb_fan.toLocaleString()} fans</p>
                    <a href="artista.html?id=${artist.id}" class="btn btn--secondary btn--micro">Ver discografía</a>
                </div>
            `;
            resultsContainer.appendChild(artistCard);
        });
    }
});