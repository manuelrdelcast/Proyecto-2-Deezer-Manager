const STORAGE_KEY = 'deezer_manager_favorites';

const StorageManager = {
    // Obtener todos los álbumes guardados
    getFavorites() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    },

    // Comprobar si un álbum específico ya es favorito
    isFavorite(albumId) {
        const favorites = this.getFavorites();
        return favorites.some(fav => String(fav.id) === String(albumId));
    },

    // Obtener la información de un favorito (útil para extraer su calificación)
    getFavorite(albumId) {
        const favorites = this.getFavorites();
        return favorites.find(fav => String(fav.id) === String(albumId));
    },

    // Agregar o quitar de favoritos (Toggle)
    toggleFavorite(album) {
        let favorites = this.getFavorites();
        const index = favorites.findIndex(fav => String(fav.id) === String(album.id));
        let isNowFav = false;

        if (index > -1) {
            // Si ya existe, lo remueve
            favorites.splice(index, 1);
        } else {
            // Si no existe, lo agrega con calificación inicial de 0
            favorites.push({
                id: album.id,
                title: album.title,
                cover: album.cover,
                artist: album.artist,
                rating: 0 
            });
            isNowFav = true;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        return isNowFav;
    },

    // Actualizar la calificación en estrellas (1-5)
    updateRating(albumId, rating) {
        let favorites = this.getFavorites();
        const album = favorites.find(fav => String(fav.id) === String(albumId));
        
        if (album) {
            album.rating = Number(rating);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        }
    }
};