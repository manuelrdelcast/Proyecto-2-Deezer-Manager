const globalAudio = document.getElementById('global-audio');
const playerTrackTitle = document.getElementById('player-track-title');
const playerArtistName = document.getElementById('player-artist-name');

function reproducirCancion(url, titulo, artista) {
    if (!url || url === "null") {
        alert("Esta canción no cuenta con una vista previa reproducible en Deezer.");
        return;
    }

    globalAudio.src = url;
    playerTrackTitle.textContent = titulo;
    playerArtistName.textContent = artista;
    
    globalAudio.play().catch(err => {
        console.log("La reproducción automática requiere interacción previa:", err);
    });
}