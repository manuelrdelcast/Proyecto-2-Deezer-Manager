// js/api.js
const DEEZER_API_BASE = 'https://api.deezer.com';
const CORS_PROXY = 'https://corsproxy.io/?'; 

/**
 * Realiza la búsqueda de artistas en la API de Deezer
 * @param {string} query - El nombre del artista a buscar
 * @returns {Promise<Array>} - Retorna un array con los resultados o vacío
 */
async function fetchArtists(query) {
    try {
        // Combinamos el proxy con el endpoint de búsqueda de Deezer
        const endpoint = `${CORS_PROXY}${encodeURIComponent(`${DEEZER_API_BASE}/search/artist?q=${query}`)}`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error('Error en la comunicación con el servidor');
        }

        const data = await response.json();
        return data.data; // Deezer devuelve los resultados dentro del nodo "data"

    } catch (error) {
        console.error("Error consumiendo la API de Deezer:", error);
        return null; // Retornamos null para manejar el error de conexión en la vista
    }
}