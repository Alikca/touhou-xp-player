// Touhou XP Music Player - Core Logic

// Sound URLs
const XP_STARTUP_URL = "https://archive.org/download/microsoft-windows-xp-startup-sound/Microsoft%20Windows%20XP%20Startup%20Sound.mp3";
const XP_ERROR_URL = "https://archive.org/download/windows-xp-error-sound-effect/Windows%20XP%20Error%20Sound%20effect.mp3";

// UI & Window State
let activeWindow = null;
let songs = [];
let filteredSongs = [];
let currentSongIndex = -1;
let isPlaying = false;
let isMuted = false;
let previousVolume = parseFloat(localStorage.getItem('touhou_volume') || '0.5');
let isShuffle = false;
let isRepeat = false;
let startupPlayed = false;

// Language state
let currentLang = localStorage.getItem('touhou_lang') || 'en';

// Favorites persistent storage
let favorites = new Set(JSON.parse(localStorage.getItem('touhou_favorites') || '[]'));

// Web Audio API Variables
/** @type {AudioContext} */
let audioCtx = null;
/** @type {MediaElementAudioSourceNode} */
let audioSource = null;
/** @type {BiquadFilterNode} */
let lowpassFilterNode = null;
/** @type {BiquadFilterNode} */
let highpassFilterNode = null;
/** @type {WaveShaperNode} */
let distortionNode = null;
/** @type {DelayNode} */
let delayNode = null;
/** @type {GainNode} */
let delayFeedbackGain = null;
/** @type {GainNode} */
let delayMixGain = null;
/** @type {ConvolverNode} */
let reverbNode = null;
/** @type {GainNode} */
let reverbMixGain = null;
/** @type {GainNode} */
let dryGain = null;
/** @type {GainNode} */
let outGain = null;
/** @type {AnalyserNode} */
let analyserNode = null;

// Visualizer State
let visualizerMode = 'bars'; // 'bars' or 'wave'
let animationId = null;

// TRANSLATION DICTIONARY
const i18n = {
    en: {
        desktop_player: "Touhou Media Player",
        desktop_mycomputer: "My Computer",
        desktop_recycle: "Recycle Bin",
        player_titlebar: "Touhou Media Player - Windows XP Edition",
        menu_file: "File",
        menu_open: "Open local file...",
        menu_exit: "Exit",
        menu_view: "View",
        menu_vis: "✓ Visualizer",
        menu_filters: "✓ Audio Filters",
        menu_playlist: "✓ Playlist",
        menu_playback: "Playback",
        menu_play_pause: "Play / Pause",
        menu_stop: "Stop",
        menu_prev: "Previous",
        menu_next: "Next",
        menu_shuffle: "Shuffle:",
        menu_repeat: "Repeat:",
        menu_help: "Help",
        menu_about: "About Touhou XP Player...",
        filters_title: "Audio Filters (DSP)",
        filters_bypass: "Bypass All Filters",
        filters_pitch: "Pitch & Speed",
        filters_lowpass: "Lowpass Filter (Underwater)",
        filters_lowpass_desc: "Attenuates high frequencies",
        filters_highpass: "Highpass Filter (Old Radio)",
        filters_highpass_desc: "Attenuates low frequencies",
        filters_delay: "Echo / Delay",
        filters_delay_time: "Time:",
        filters_delay_fb: "Feedback:",
        filters_dist: "Distortion / Overdrive",
        filters_dist_desc: "Adds analog saturation",
        filters_reverb: "Reverb (Cathedral / Hall)",
        filters_reverb_desc: "Simulates acoustic space",
        vis_spectrum: "Spectrum",
        vis_oscilloscope: "Oscilloscope",
        start_text: "start",
        taskbar_player: "Touhou Media Player",
        taskbar_readme: "Readme.txt - Note...",
        start_username: "Gensokyo Administrator",
        start_player_desc: "Music player",
        start_readme_desc: "Notepad (Help)",
        start_quick_filter: "Quick game filter:",
        start_documents: "My Documents",
        start_recent_music: "My Recent Music",
        start_control_panel: "Control Panel",
        start_help_support: "Help and Support",
        start_search_internet: "Search Internet",
        error_title: "System Message",
        error_btn: "OK",
        notepad_menu_file: "File",
        notepad_menu_edit: "Edit",
        notepad_menu_format: "Format",
        notepad_menu_help: "Help",
        notepad_title: "Readme.txt - Notepad",
        start_logoff: "Log Off",
        start_shutdown: "Shut Down",
        on: "ON",
        off: "OFF",
        lang_toggle_tooltip: "Toggle Language (English / Español)",
        btn_play: "Play",
        btn_pause: "Pause",
        btn_stop: "Stop",
        btn_prev: "Previous",
        btn_next: "Next",
        btn_mute: "Mute",
        btn_unmute: "Unmute",
        desktop_minesweeper: "Minesweeper",
        desktop_paint: "Paint",
        taskbar_minesweeper: "Minesweeper",
        taskbar_paint: "untitled - Paint",
        minesweeper_title: "Minesweeper",
        paint_title: "untitled - Paint",
        menu_game: "Game",
        menu_new_game: "New",
        paint_new: "New",
        paint_save: "Save Image...",
        paint_undo: "Undo (Ctrl+Z)",
        paint_clear: "Clear Image",
        desktop_pet: "Reimu Shimeji",
        menu_toggle_pet: "Toggle Reimu Pet",
        desktop_marisa: "Marisa Shimeji",
        menu_toggle_marisa: "Toggle Marisa Pet",
        desktop_cirno: "Cirno Shimeji",
        menu_toggle_cirno: "Toggle Cirno Pet",
        
        // Dynamic labels & alerts
        no_song_selected: "No song selected",
        select_track: "Select a track from the list",
        year_label: "Year: ",
        loading_songs: "Loading songs...",
        no_songs_found: "No songs found",
        songs_suffix: "songs",
        search_placeholder: "Search song...",
        all_series: "All Series",
        my_favorites: "★ My Favorites",
        status_ready: "Ready",
        status_playing: "Playing...",
        status_paused: "Paused",
        status_loading: "Loading...",
        status_error: "Playback Error",
        alert_documents: "Exploring My Computer - Music folder is empty.",
        alert_control_panel: "Opening Audio Control Panel...",
        alert_logoff: "Logging off...",
        confirm_shutdown: "Are you sure you want to shut down this virtual Gensokyo PC?",
        shutdown_text: "It is now safe to turn off your computer.",
        btn_restart: "Restart PC",
        recycle_empty: "The Recycle Bin is empty. There are no deleted files to restore.",
        computer_denied: "Access denied to My Computer: you do not have Gensokyo Server Administrator privileges.",
        volume_title: "Volume",
        
        // Notepad readme
        readme_content: `=== TOUHOU BGM PLAYER (Windows XP Edition) ===

Welcome to the Touhou Project music player!

This player combines the visual nostalgia of the classic Windows XP operating system (Windows Media Player style) with modern web audio processing technologies.

FEATURES:
---------
1. EXTENSIVE LIBRARY: Over 200 official Touhou tracks, from Touhou 6 (Embodiment of Scarlet Devil) to Touhou 17 (Wily Beast and Weakest Creature), including special Bad Apple!! arrangements.
2. REAL-TIME AUDIO FILTERS (DSP):
   - Pitch & Speed: Adjust tempo and pitch dynamically.
   - Lowpass: Moggles treble frequencies for an underwater effect.
   - Highpass: Filters out bass for a tinny, old AM radio sound.
   - Echo / Delay: Creates repeating feedback echoes.
   - Distortion / Overdrive: Adds warmth and analog clipping.
   - Reverb: Simulates the 3D acoustics of massive spaces or cathedrals.
3. DYNAMIC VISUALIZER: Real-time Canvas spectrum analyzer or oscilloscope waveforms.
4. INTERACTIVE INTERFACE: Windows are draggable, maximizable, and can be minimized to the taskbar.

LEGAL INFORMATION:
------------------
- Touhou Project music and characters belong to Team Shanghai Alice / ZUN.
- Audio tracks are compiled from community-hosted, CORS-enabled Archive.org collections.
- Reimu character sprites are ripped by DarkOverord (https://www.spriters-resource.com/profile/darkoverord/).

Enjoy your musical journey through Gensokyo!`
    },
    es: {
        desktop_player: "Touhou Media Player",
        desktop_mycomputer: "Mi PC",
        desktop_recycle: "Papelera",
        player_titlebar: "Touhou Media Player - Edición Windows XP",
        menu_file: "Archivo",
        menu_open: "Abrir archivo local...",
        menu_exit: "Salir",
        menu_view: "Ver",
        menu_vis: "✓ Visualizador",
        menu_filters: "✓ Filtros de Audio",
        menu_playlist: "✓ Lista de Reproducción",
        menu_playback: "Reproducción",
        menu_play_pause: "Reproducir / Pausar",
        menu_stop: "Detener",
        menu_prev: "Anterior",
        menu_next: "Siguiente",
        menu_shuffle: "Aleatorio:",
        menu_repeat: "Repetir:",
        menu_help: "Ayuda",
        menu_about: "Acerca de Touhou XP Player...",
        filters_title: "Filtros de Audio (DSP)",
        filters_bypass: "Desactivar Todos los Filtros",
        filters_pitch: "Tono y Velocidad",
        filters_lowpass: "Filtro Pasa-Bajos (Subacuático)",
        filters_lowpass_desc: "Atenúa frecuencias agudas",
        filters_highpass: "Filtro Pasa-Altos (Radio Antigua)",
        filters_highpass_desc: "Atenúa frecuencias graves",
        filters_delay: "Eco / Delay",
        filters_delay_time: "Tiempo:",
        filters_delay_fb: "Retroalimentación:",
        filters_dist: "Distorsión / Overdrive",
        filters_dist_desc: "Añade saturación analógica",
        filters_reverb: "Reverberación (Catedral / Hall)",
        filters_reverb_desc: "Simula espacialidad acústica",
        vis_spectrum: "Espectro",
        vis_oscilloscope: "Osciloscopio",
        start_text: "inicio",
        taskbar_player: "Touhou Media Player",
        taskbar_readme: "Readme.txt - Bloc...",
        start_username: "Administrador de Gensokyo",
        start_player_desc: "Reproductor de música",
        start_readme_desc: "Bloc de notas (Ayuda)",
        start_quick_filter: "Filtro rápido por juego:",
        start_documents: "Mis documentos",
        start_recent_music: "Mi música reciente",
        start_control_panel: "Panel de control",
        start_help_support: "Ayuda y soporte",
        start_search_internet: "Buscar en internet",
        error_title: "Mensaje del Sistema",
        error_btn: "Aceptar",
        notepad_menu_file: "Archivo",
        notepad_menu_edit: "Edición",
        notepad_menu_format: "Formato",
        notepad_menu_help: "Ayuda",
        notepad_title: "Readme.txt - Bloc de notas",
        start_logoff: "Cerrar sesión",
        start_shutdown: "Apagar",
        on: "SÍ",
        off: "NO",
        lang_toggle_tooltip: "Cambiar idioma (Español / English)",
        btn_play: "Reproducir",
        btn_pause: "Pausar",
        btn_stop: "Detener",
        btn_prev: "Anterior",
        btn_next: "Siguiente",
        btn_mute: "Silenciar",
        btn_unmute: "Activar sonido",
        desktop_minesweeper: "Buscaminas",
        desktop_paint: "Paint",
        taskbar_minesweeper: "Buscaminas",
        taskbar_paint: "sin título - Paint",
        minesweeper_title: "Buscaminas",
        paint_title: "sin título - Paint",
        menu_game: "Juego",
        menu_new_game: "Nuevo",
        paint_new: "Nuevo",
        paint_save: "Guardar imagen...",
        paint_undo: "Deshacer (Ctrl+Z)",
        paint_clear: "Borrar imagen",
        desktop_pet: "Reimu Shimeji",
        menu_toggle_pet: "Mascota Reimu",
        desktop_marisa: "Marisa Shimeji",
        menu_toggle_marisa: "Mascota Marisa",
        desktop_cirno: "Cirno Shimeji",
        menu_toggle_cirno: "Mascota Cirno",
        
        // Dynamic labels & alerts
        no_song_selected: "Ninguna canción seleccionada",
        select_track: "Selecciona una pista de la lista",
        year_label: "Año: ",
        loading_songs: "Cargando canciones...",
        no_songs_found: "No se encontraron canciones",
        songs_suffix: "canciones",
        search_placeholder: "Buscar canción...",
        all_series: "Todas las sagas",
        my_favorites: "★ Mis Favoritos",
        status_ready: "Listo",
        status_playing: "Reproduciendo...",
        status_paused: "Pausado",
        status_loading: "Cargando...",
        status_error: "Error de reproducción",
        alert_documents: "Explorando Mi PC - Carpeta de música vacía.",
        alert_control_panel: "Abriendo Panel de Control de Audio...",
        alert_logoff: "Cerrando sesión...",
        confirm_shutdown: "¿Estás seguro de que quieres apagar este PC de Gensokyo virtual?",
        shutdown_text: "Ahora puede apagar su equipo con seguridad.",
        btn_restart: "Reiniciar PC",
        recycle_empty: "La Papelera de reciclaje está vacía. No hay archivos eliminados para restaurar.",
        computer_denied: "Acceso denegado a Mi PC: no tienes privilegios de Administrador del Servidor de Gensokyo.",
        volume_title: "Volumen",

        // Notepad readme
        readme_content: `=== TOUHOU BGM PLAYER (Edición Windows XP) ===

¡Bienvenido al reproductor de música de la saga de videojuegos Touhou Project!

Este reproductor combina la nostalgia visual del clásico sistema operativo Windows XP (estilo Windows Media Player) con tecnologías modernas de procesamiento de audio web.

CARACTERÍSTICAS:
----------------
1. BIBLIOTECA EXTENSA: Más de 200 canciones oficiales de Touhou, desde Touhou 6 (Embodiment of Scarlet Devil) hasta Touhou 17 (Wily Beast and Weakest Creature), incluyendo arreglos especiales de Bad Apple!!.
2. FILTROS DE AUDIO DIGITAL (DSP) EN TIEMPO REAL:
   - Tono y Velocidad: Aumenta o disminuye el tempo e infiere efectos agudos/graves.
   - Pasa-Bajos: Genera un ambiente subacuático amortiguando las frecuencias agudas.
   - Pasa-Altos: Emula el sonido estridente de una radio AM antigua.
   - Eco / Delay: Genera reflexiones de sonido repetitivas con retroalimentación ajustable.
   - Distorsión / Overdrive: Añade calidez analógica y clipping de onda.
   - Reverberación: Simula la acústica tridimensional de salas gigantes o catedrales.
3. VISUALIZADOR DINÁMICO: Renderizado nativo por Canvas en modo "Espectro" o modo "Osciloscopio".
4. INTERFAZ INTERACTIVA: Las ventanas de este escritorio de XP son arrastrables, maximizables, y se pueden minimizar a la barra de tareas.

INFORMACIÓN LEGAL:
------------------
- La música de Touhou Project y los personajes pertenecen a Team Shanghai Alice / ZUN.
- Las pistas de audio son provistas por la comunidad y recopiladas mediante archivos directos de Internet Archive que permiten CORS.
- Los sprites del personaje de Reimu han sido extraídos por DarkOverord (https://www.spriters-resource.com/profile/darkoverord/).

¡Disfruta del viaje musical por Gensokyo!`
    }
};

// DOM Elements
const audioEl = document.getElementById('main-audio');
const playBtn = document.getElementById('btn-play');
const stopBtn = document.getElementById('btn-stop');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const muteBtn = document.getElementById('btn-mute');
const volumeSlider = document.getElementById('player-volume');
const seekSlider = document.getElementById('player-seek');
const timeCurrent = document.getElementById('time-current');
const timeDuration = document.getElementById('time-duration');
const currentTitle = document.getElementById('current-title');
const currentGame = document.getElementById('current-game');
const currentYear = document.getElementById('current-year');
const playerStatus = document.getElementById('player-status');
const canvas = document.getElementById('visualizer-canvas');
const canvasCtx = canvas.getContext('2d');
const searchInput = document.getElementById('playlist-search');
const filterSelect = document.getElementById('playlist-filter');
const tracksContainer = document.getElementById('playlist-tracks');
const songsCount = document.getElementById('songs-count');
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');
const trayClock = document.getElementById('tray-clock');
const desktop = document.getElementById('desktop');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Draggable Windows
    makeWindowsDraggable();

    // Load Songs Playlist
    loadSongs();

    // Register Event Listeners
    setupPlayerEventListeners();
    setupDesktopEvents();
    setupFilters();

    // Initialize volume from localStorage (default to 50%)
    const savedVolume = parseFloat(localStorage.getItem('touhou_volume') || '0.5');
    audioEl.volume = savedVolume;
    volumeSlider.value = savedVolume * 100;
    updateVolumeIcon(savedVolume);

    // Initialize Minesweeper & Paint
    initMinesweeper();
    initPaint();

    // Apply active language configuration
    updateLanguageUI();

    // Focus window player by default
    focusWindow(document.getElementById('window-player'));
});

// Update System Tray Clock
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 12 instead of 0
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    // XP tray clock display
    trayClock.textContent = `${hours}:${minutes} ${ampm}`;
}

// DRAGGABLE WINDOWS LOGIC
function makeWindowsDraggable() {
    const windows = document.querySelectorAll('.xp-window');
    
    windows.forEach(win => {
        const header = win.querySelector('.title-bar');
        if (!header) return;

        // Focus on click
        win.addEventListener('mousedown', () => {
            focusWindow(win);
        });

        let isDragging = false;
        let startX, startY;
        let originalLeft, originalTop;

        header.addEventListener('mousedown', (e) => {
            // Avoid dragging on button click
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            focusWindow(win);

            startX = e.clientX;
            startY = e.clientY;
            
            originalLeft = win.offsetLeft;
            originalTop = win.offsetTop;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            e.preventDefault();
        });

        function drag(e) {
            if (!isDragging || win.classList.contains('maximized')) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newLeft = originalLeft + dx;
            let newTop = originalTop + dy;

            // Keep within desktop area boundaries (partially at least)
            const desktopWidth = desktop.clientWidth;
            const desktopHeight = desktop.clientHeight;
            
            if (newTop < 0) newTop = 0;
            if (newTop > desktopHeight - 40) newTop = desktopHeight - 40;
            if (newLeft < -win.clientWidth + 50) newLeft = -win.clientWidth + 50;
            if (newLeft > desktopWidth - 50) newLeft = desktopWidth - 50;

            win.style.left = `${newLeft}px`;
            win.style.top = `${newTop}px`;
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }
    });
}

function focusWindow(win) {
    if (!win) return;
    document.querySelectorAll('.xp-window').forEach(w => w.classList.remove('active'));
    win.classList.add('active');
    activeWindow = win;

    // Highlight corresponding taskbar item
    const winId = win.id;
    document.querySelectorAll('.taskbar-tasks .task-btn').forEach(btn => btn.classList.remove('active'));
    const taskBtn = document.getElementById(`taskbar-btn-${winId}`);
    if (taskBtn) {
        taskBtn.classList.add('active');
        taskBtn.classList.remove('hidden');
    }
}

// Window actions
function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.add('minimized');
        win.classList.remove('active');
        
        // Remove active class from taskbar button
        const taskBtn = document.getElementById(`taskbar-btn-${id}`);
        if (taskBtn) {
            taskBtn.classList.remove('active');
        }
    }
}

function toggleMaximize(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.toggle('maximized');
    }
}

function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.add('minimized'); // we hide it for retro feel
        
        // Hide taskbar button
        const taskBtn = document.getElementById(`taskbar-btn-${id}`);
        if (taskBtn) {
            taskBtn.classList.add('hidden');
        }
        
        if (id === 'window-player') {
            stopSong();
        }
    }
}

function openWindow(id) {
    if (id === 'toggle-pet') {
        toggleDesktopPet();
        return;
    }
    if (id === 'toggle-marisa') {
        playSystemSound(XP_ERROR_URL);
        showErrorDialog(currentLang === 'es' ? "Marisa Shimeji no está disponible todavía. ¡La implementaremos pronto!" : "Marisa Shimeji is not available yet. We will implement it soon!");
        return;
    }
    if (id === 'toggle-cirno') {
        playSystemSound(XP_ERROR_URL);
        showErrorDialog(currentLang === 'es' ? "Cirno Shimeji no está disponible todavía. ¡La implementaremos pronto!" : "Cirno Shimeji is not available yet. We will implement it soon!");
        return;
    }
    const win = document.getElementById(id);
    if (win) {
        win.classList.remove('minimized');
        focusWindow(win);
        
        const taskBtn = document.getElementById(`taskbar-btn-${id}`);
        if (taskBtn) {
            taskBtn.classList.remove('hidden');
            taskBtn.classList.add('active');
        }
    }
}

function toggleMinimizeFromTaskbar(id) {
    const win = document.getElementById(id);
    if (!win) return;
    
    if (win.classList.contains('minimized')) {
        openWindow(id);
    } else if (win.classList.contains('active')) {
        minimizeWindow(id);
    } else {
        focusWindow(win);
    }
}

// LANGUAGE TRANSLATION SWITCHER
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    localStorage.setItem('touhou_lang', currentLang);
    updateLanguageUI();
}

function updateLanguageUI() {
    // 1. Translate statically configured elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[currentLang][key]) {
            // Special handling for the start button to preserve the flag SVG child
            if (key === 'start_text') {
                const flag = el.querySelector('.start-flag');
                el.textContent = i18n[currentLang][key];
                if (flag) el.prepend(flag);
            } else {
                el.textContent = i18n[currentLang][key];
            }
        }
    });

    // 2. Update the language bar tray indicator
    const trayLang = document.getElementById('tray-lang');
    if (trayLang) {
        trayLang.textContent = currentLang.toUpperCase();
        trayLang.title = i18n[currentLang].lang_toggle_tooltip;
    }

    // 3. Update dynamic input placeholders
    searchInput.placeholder = i18n[currentLang].search_placeholder;

    // 4. Update Notepad contents
    document.getElementById('notepad-text').value = i18n[currentLang].readme_content;

    // 5. Update fallback song metadata labels
    if (currentSongIndex === -1) {
        currentTitle.textContent = i18n[currentLang].no_song_selected;
        currentGame.textContent = i18n[currentLang].select_track;
        currentYear.textContent = "-";
    } else {
        const song = filteredSongs[currentSongIndex];
        currentYear.textContent = `${i18n[currentLang].year_label}${song.year}`;
    }

    // 6. Update current status text
    if (isPlaying) {
        playerStatus.textContent = i18n[currentLang].status_playing;
    } else if (playerStatus.textContent === "Listo" || playerStatus.textContent === "Ready") {
        playerStatus.textContent = i18n[currentLang].status_ready;
    } else if (playerStatus.textContent === "Pausado" || playerStatus.textContent === "Paused") {
        playerStatus.textContent = i18n[currentLang].status_paused;
    } else if (playerStatus.textContent === "Cargando..." || playerStatus.textContent === "Loading...") {
        playerStatus.textContent = i18n[currentLang].status_loading;
    } else if (playerStatus.textContent === "Error de reproducción" || playerStatus.textContent === "Playback Error") {
        playerStatus.textContent = i18n[currentLang].status_error;
    }

    // 6.5. Update button titles (tooltips)
    document.getElementById('btn-prev').title = i18n[currentLang].btn_prev;
    document.getElementById('btn-next').title = i18n[currentLang].btn_next;
    document.getElementById('btn-stop').title = i18n[currentLang].btn_stop;
    playBtn.title = isPlaying ? i18n[currentLang].btn_pause : i18n[currentLang].btn_play;
    muteBtn.title = isMuted ? i18n[currentLang].btn_unmute : i18n[currentLang].btn_mute;

    // 6.6. Update shuffle/repeat status labels
    const shuffleInd = document.getElementById('shuffle-indicator');
    if (shuffleInd) {
        shuffleInd.textContent = isShuffle ? i18n[currentLang].on : i18n[currentLang].off;
    }
    const repeatInd = document.getElementById('repeat-indicator');
    if (repeatInd) {
        repeatInd.textContent = isRepeat ? i18n[currentLang].on : i18n[currentLang].off;
    }

    // 7. Update playlist game filter select dropdown
    if (songs.length > 0) {
        const prevFilterVal = filterSelect.value;
        const games = [...new Set(songs.map(s => s.game))].sort();
        filterSelect.innerHTML = `
            <option value="all">${i18n[currentLang].all_series}</option>
            <option value="favorites">${i18n[currentLang].my_favorites}</option>
        `;
        games.forEach(game => {
            const opt = document.createElement('option');
            opt.value = game;
            opt.textContent = game;
            filterSelect.appendChild(opt);
        });
        filterSelect.value = prevFilterVal || 'all';
    }

    // 8. Re-render playlist to update titles and star button tooltips
    if (songs.length > 0) {
        renderPlaylist();
    }
}

// PLAYLIST & DATA LOADING
async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) throw new Error("No se pudo cargar songs.json");
        songs = await response.json();
        
        filteredSongs = [...songs];
        
        // Populate game filter select dropdown based on language
        const games = [...new Set(songs.map(s => s.game))].sort();
        filterSelect.innerHTML = `
            <option value="all">${i18n[currentLang].all_series}</option>
            <option value="favorites">${i18n[currentLang].my_favorites}</option>
        `;
        games.forEach(game => {
            const opt = document.createElement('option');
            opt.value = game;
            opt.textContent = game;
            filterSelect.appendChild(opt);
        });

        // Start Menu game links
        const startGameLinks = document.getElementById('start-game-links');
        startGameLinks.innerHTML = '';
        games.forEach(game => {
            const link = document.createElement('div');
            link.className = 'game-link';
            let displayName = game.replace("Touhou ", "TH");
            link.textContent = displayName;
            link.onclick = () => {
                filterSelect.value = game;
                filterPlaylist();
                toggleStartMenu();
                openWindow('window-player');
            };
            startGameLinks.appendChild(link);
        });

        renderPlaylist();
        
        // Restore last played song and time if available
        const savedUrl = localStorage.getItem('xp_player_saved_song_url');
        if (savedUrl) {
            const idx = filteredSongs.findIndex(s => s.url === savedUrl);
            if (idx !== -1) {
                restoreSongAtIndex(idx);
            }
        }
    } catch (err) {
        console.error(err);
        tracksContainer.innerHTML = `<div class="loading-label" style="color:red;">${i18n[currentLang].status_error}: ${err.message}</div>`;
    }
}

function renderPlaylist() {
    tracksContainer.innerHTML = '';
    
    if (filteredSongs.length === 0) {
        tracksContainer.innerHTML = `<div class="loading-label">${i18n[currentLang].no_songs_found}</div>`;
        songsCount.textContent = `0 ${i18n[currentLang].songs_suffix}`;
        return;
    }

    filteredSongs.forEach((song, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        if (index === currentSongIndex) {
            trackItem.classList.add('active');
        }

        // Duration helper
        const min = Math.floor(song.duration / 60);
        let sec = Math.floor(song.duration % 60);
        sec = sec < 10 ? '0' + sec : sec;
        const durationStr = song.duration > 0 ? `${min}:${sec}` : '--:--';

        const isFav = favorites.has(song.id);
        const tooltipStr = isFav ? i18n[currentLang].my_favorites : ""; // or simple tooltip

        trackItem.innerHTML = `
            <div class="track-meta">
                <span class="track-name">${song.title}</span>
                <span class="track-sub">${song.game} (${song.year})</span>
            </div>
            <span class="fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Remove' : 'Favorite'}">${isFav ? '★' : '☆'}</span>
            <span class="track-duration">${durationStr}</span>
        `;

        trackItem.addEventListener('click', () => {
            playSongAtIndex(index);
        });

        // Toggle favorite event listener
        const favBtn = trackItem.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent playing track on star click
            toggleFavorite(song.id);
        });

        tracksContainer.appendChild(trackItem);
    });

    songsCount.textContent = `${filteredSongs.length} ${i18n[currentLang].songs_suffix}`;
}

function toggleFavorite(songId) {
    if (favorites.has(songId)) {
        favorites.delete(songId);
    } else {
        favorites.add(songId);
    }
    // Save to localStorage
    localStorage.setItem('touhou_favorites', JSON.stringify([...favorites]));
    
    // Refresh playlist view if we are currently filtering by favorites
    if (filterSelect.value === 'favorites') {
        filterPlaylist();
    } else {
        renderPlaylist();
    }
}

function filterPlaylist() {
    const query = searchInput.value.toLowerCase().trim();
    const gameFilter = filterSelect.value;
    
    // Remember current selected song's original ID to re-match the active index after filtering
    let currentPlayingId = null;
    if (currentSongIndex >= 0 && currentSongIndex < filteredSongs.length) {
        currentPlayingId = filteredSongs[currentSongIndex].id;
    }

    filteredSongs = songs.filter(song => {
        const matchesSearch = song.title.toLowerCase().includes(query) || song.game.toLowerCase().includes(query);
        let matchesGame = false;
        if (gameFilter === 'all') {
            matchesGame = true;
        } else if (gameFilter === 'favorites') {
            matchesGame = favorites.has(song.id);
        } else {
            matchesGame = song.game === gameFilter;
        }
        return matchesSearch && matchesGame;
    });

    // Re-align currentSongIndex
    if (currentPlayingId) {
        currentSongIndex = filteredSongs.findIndex(s => s.id === currentPlayingId);
    } else {
        currentSongIndex = -1;
    }

    renderPlaylist();
}

// SETUP AUDIO CONTEXT & DSP NODES
function initAudio() {
    // Create Context
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }

    if (audioSource) return; // already initialized nodes

    // Create nodes
    audioSource = audioCtx.createMediaElementSource(audioEl);
    
    lowpassFilterNode = audioCtx.createBiquadFilter();
    lowpassFilterNode.type = 'lowpass';
    lowpassFilterNode.Q.value = 1;
    
    highpassFilterNode = audioCtx.createBiquadFilter();
    highpassFilterNode.type = 'highpass';
    highpassFilterNode.Q.value = 1;

    distortionNode = audioCtx.createWaveShaper();
    distortionNode.oversample = '4x';

    // Delay Loop setup
    delayNode = audioCtx.createDelay(1.0);
    delayFeedbackGain = audioCtx.createGain();
    delayMixGain = audioCtx.createGain();
    
    // Connect feedback loop: delayNode -> feedbackGain -> delayNode
    delayNode.connect(delayFeedbackGain);
    delayFeedbackGain.connect(delayNode);

    // Reverb node setup
    reverbNode = audioCtx.createConvolver();
    reverbNode.buffer = createImpulseResponseBuffer(audioCtx, 2.5, 2.0); // 2.5s duration, 2.0 decay
    reverbMixGain = audioCtx.createGain();

    dryGain = audioCtx.createGain();
    outGain = audioCtx.createGain();
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;

    // Default parameters
    updateDSP();

    // Connections:
    audioSource.connect(lowpassFilterNode);
    lowpassFilterNode.connect(highpassFilterNode);
    highpassFilterNode.connect(distortionNode);
    
    distortionNode.connect(dryGain);
    distortionNode.connect(delayNode);
    delayNode.connect(delayMixGain);
    
    distortionNode.connect(reverbNode);
    reverbNode.connect(reverbMixGain);

    dryGain.connect(outGain);
    delayMixGain.connect(outGain);
    reverbMixGain.connect(outGain);

    outGain.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);
}

// Generate algorithmic Room/Hall Impulse Response buffer
function createImpulseResponseBuffer(context, duration, decay) {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const percent = i / length;
        const decayEnvelope = Math.pow(1 - percent, decay);
        left[i] = (Math.random() * 2 - 1) * decayEnvelope;
        right[i] = (Math.random() * 2 - 1) * decayEnvelope;
    }
    return impulse;
}

// Classic distortion wave shaping curve
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

// Apply settings from sliders to Web Audio DSP nodes
function updateDSP() {
    if (!audioCtx) return;

    const bypass = document.getElementById('bypass-filters').checked;

    if (bypass) {
        lowpassFilterNode.frequency.setValueAtTime(22000, audioCtx.currentTime);
        highpassFilterNode.frequency.setValueAtTime(10, audioCtx.currentTime);
        distortionNode.curve = null;
        delayFeedbackGain.gain.setValueAtTime(0, audioCtx.currentTime);
        delayMixGain.gain.setValueAtTime(0, audioCtx.currentTime);
        reverbMixGain.gain.setValueAtTime(0, audioCtx.currentTime);
        dryGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        
        audioEl.playbackRate = 1.0;
        document.getElementById('filter-pitch').value = 1.0;
        document.getElementById('pitch-val').textContent = "1.0x";
        return;
    }

    const speed = parseFloat(document.getElementById('filter-pitch').value);
    audioEl.playbackRate = speed;
    document.getElementById('pitch-val').textContent = speed.toFixed(2) + "x";

    const enableLP = document.getElementById('enable-lowpass').checked;
    const lpVal = parseFloat(document.getElementById('filter-lowpass').value);
    if (enableLP) {
        lowpassFilterNode.frequency.setValueAtTime(lpVal, audioCtx.currentTime);
    } else {
        lowpassFilterNode.frequency.setValueAtTime(22000, audioCtx.currentTime);
    }

    const enableHP = document.getElementById('enable-highpass').checked;
    const hpVal = parseFloat(document.getElementById('filter-highpass').value);
    if (enableHP) {
        highpassFilterNode.frequency.setValueAtTime(hpVal, audioCtx.currentTime);
    } else {
        highpassFilterNode.frequency.setValueAtTime(10, audioCtx.currentTime);
    }

    const enableDist = document.getElementById('enable-distortion').checked;
    const distAmount = parseFloat(document.getElementById('filter-distortion').value);
    if (enableDist) {
        distortionNode.curve = makeDistortionCurve(distAmount);
    } else {
        distortionNode.curve = null;
    }

    const enableDelay = document.getElementById('enable-delay').checked;
    const delayTime = parseFloat(document.getElementById('filter-delay-time').value);
    const delayFb = parseFloat(document.getElementById('filter-delay-feedback').value);
    
    document.getElementById('delay-time-val').textContent = delayTime.toFixed(1) + "s";
    document.getElementById('delay-feedback-val').textContent = Math.round(delayFb * 100) + "%";

    if (enableDelay) {
        delayNode.delayTime.setValueAtTime(delayTime, audioCtx.currentTime);
        delayFeedbackGain.gain.setValueAtTime(delayFb, audioCtx.currentTime);
        delayMixGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        dryGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    } else {
        delayFeedbackGain.gain.setValueAtTime(0, audioCtx.currentTime);
        delayMixGain.gain.setValueAtTime(0, audioCtx.currentTime);
        dryGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    }

    const enableReverb = document.getElementById('enable-reverb').checked;
    const reverbAmount = parseFloat(document.getElementById('filter-reverb').value);
    if (enableReverb) {
        reverbMixGain.gain.setValueAtTime((reverbAmount / 100) * 0.7, audioCtx.currentTime);
        dryGain.gain.setValueAtTime(Math.max(0.3, 1.0 - (reverbAmount / 100) * 0.5), audioCtx.currentTime);
    } else {
        reverbMixGain.gain.setValueAtTime(0, audioCtx.currentTime);
        if (!enableDelay) {
            dryGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        }
    }
}

// SETUP LISTENERS
function setupPlayerEventListeners() {
    playBtn.addEventListener('click', togglePlay);
    stopBtn.addEventListener('click', stopSong);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);

    // Audio Element Callbacks
    audioEl.addEventListener('play', () => {
        isPlaying = true;
        document.getElementById('window-player').classList.add('playing');
        playBtn.title = i18n[currentLang].btn_pause;
        playBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x='6' y='5' width='4' height='14' fill='currentColor'/><rect x='14' y='5' width='4' height='14' fill='currentColor'/></svg>`;
        playerStatus.textContent = i18n[currentLang].status_playing;
        
        startVisualizer();
    });

    audioEl.addEventListener('pause', () => {
        isPlaying = false;
        document.getElementById('window-player').classList.remove('playing');
        playBtn.title = i18n[currentLang].btn_play;
        playBtn.innerHTML = `<svg viewBox="0 0 24 24" id="play-icon"><polygon points='8,5 19,12 8,19' fill='currentColor'/></svg>`;
        playerStatus.textContent = i18n[currentLang].status_paused;
    });

    audioEl.addEventListener('ended', () => {
        if (isRepeat) {
            audioEl.currentTime = 0;
            audioEl.play();
        } else {
            nextSong();
        }
    });

    audioEl.addEventListener('timeupdate', () => {
        if (!isNaN(audioEl.duration)) {
            const current = audioEl.currentTime;
            const duration = audioEl.duration;
            seekSlider.value = (current / duration) * 100;
            
            timeCurrent.textContent = formatTime(current);
            timeDuration.textContent = formatTime(duration);
            
            // Save time periodically
            localStorage.setItem('xp_player_saved_time', current.toString());
        }
    });

    audioEl.addEventListener('durationchange', () => {
        if (!isNaN(audioEl.duration)) {
            timeDuration.textContent = formatTime(audioEl.duration);
            seekSlider.disabled = false;
        }
    });

    seekSlider.addEventListener('input', () => {
        if (!isNaN(audioEl.duration)) {
            const seekTo = (seekSlider.value / 100) * audioEl.duration;
            audioEl.currentTime = seekTo;
        }
    });

    volumeSlider.addEventListener('input', () => {
        const val = volumeSlider.value / 100;
        audioEl.volume = val;
        localStorage.setItem('touhou_volume', val);
        updateVolumeIcon(val);
    });

    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            previousVolume = audioEl.volume;
            audioEl.volume = 0;
            volumeSlider.value = 0;
            muteBtn.title = i18n[currentLang].btn_unmute;
            muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z' fill='currentColor'/></svg>`;
        } else {
            audioEl.volume = previousVolume;
            volumeSlider.value = previousVolume * 100;
            muteBtn.title = i18n[currentLang].btn_mute;
            updateVolumeIcon(previousVolume);
        }
    });

    searchInput.addEventListener('input', filterPlaylist);
    filterSelect.addEventListener('change', filterPlaylist);
    document.getElementById('search-clear').addEventListener('click', () => {
        searchInput.value = '';
        filterPlaylist();
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            
            const localSong = {
                id: `local_${Date.now()}`,
                game: currentLang === 'en' ? "Local file" : "Archivo local",
                year: currentLang === 'en' ? "New" : "Nuevo",
                title: file.name.replace(/\.[^/.]+$/, ""),
                duration: 0,
                url: fileUrl,
                filename: file.name
            };

            songs.unshift(localSong);
            filteredSongs = [...songs];
            renderPlaylist();
            
            playSongAtIndex(0);
        }
    });

    // Start Menu Right Column Actions (Localized)
    document.getElementById('start-documents-btn').addEventListener('click', () => {
        alert(i18n[currentLang].alert_documents);
    });
    document.getElementById('start-control-btn').addEventListener('click', () => {
        alert(i18n[currentLang].alert_control_panel);
    });
    document.getElementById('btn-logoff').addEventListener('click', () => {
        alert(i18n[currentLang].alert_logoff);
    });
}

function updateVolumeIcon(val) {
    if (val === 0) {
        muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z' fill='currentColor'/></svg>`;
    } else if (val < 0.4) {
        muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d='M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z' fill='currentColor'/></svg>`;
    } else {
        muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' fill='currentColor'/></svg>`;
    }
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    s = s < 10 ? '0' + s : s;
    return `${m}:${s}`;
}

// SETUP FILTERS LOGIC
function setupFilters() {
    const bypassCheckbox = document.getElementById('bypass-filters');
    const checkboxes = [
        'enable-lowpass',
        'enable-highpass',
        'enable-distortion',
        'enable-delay',
        'enable-reverb'
    ];

    const ranges = [
        'filter-pitch',
        'filter-lowpass',
        'filter-highpass',
        'filter-delay-time',
        'filter-delay-feedback',
        'filter-distortion',
        'filter-reverb'
    ];

    bypassCheckbox.addEventListener('change', updateDSP);

    checkboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            if (document.getElementById(id).checked) {
                bypassCheckbox.checked = false;
            }
            updateDSP();
        });
    });

    ranges.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            bypassCheckbox.checked = false;
            updateDSP();
        });
    });
}

// PLAYBACK LOGIC
function playSongAtIndex(index) {
    if (index < 0 || index >= filteredSongs.length) return;
    
    currentSongIndex = index;
    const song = filteredSongs[currentSongIndex];
    
    document.querySelectorAll('.track-item').forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('active');
        }
    });

    // Update metadata labels using dynamic prefix
    currentTitle.textContent = song.title;
    currentGame.textContent = song.game;
    currentYear.textContent = `${i18n[currentLang].year_label}${song.year}`;
    playerStatus.textContent = i18n[currentLang].status_loading;

    audioEl.src = song.url;
    audioEl.load();
    
    localStorage.setItem('xp_player_saved_song_url', song.url);
    localStorage.setItem('xp_player_saved_time', '0');

    if (!audioSource) {
        initAudio();
    }
    
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    audioEl.play().catch(err => {
        console.warn("Reproducción abortada:", err);
        playerStatus.textContent = i18n[currentLang].status_error;
    });

    updateDSP();
}

function restoreSongAtIndex(index) {
    if (index < 0 || index >= filteredSongs.length) return;
    
    currentSongIndex = index;
    const song = filteredSongs[currentSongIndex];
    
    document.querySelectorAll('.track-item').forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('active');
        }
    });

    currentTitle.textContent = song.title;
    currentGame.textContent = song.game;
    currentYear.textContent = `${i18n[currentLang].year_label}${song.year}`;
    playerStatus.textContent = i18n[currentLang].status_ready;

    audioEl.src = song.url;
    audioEl.load();

    const savedTime = parseFloat(localStorage.getItem('xp_player_saved_time') || '0');
    if (savedTime > 0) {
        const setTimeHandler = () => {
            audioEl.currentTime = savedTime;
            if (song.duration > 0) {
                seekSlider.value = (savedTime / song.duration) * 100;
            }
            timeCurrent.textContent = formatTime(savedTime);
            audioEl.removeEventListener('loadedmetadata', setTimeHandler);
        };
        audioEl.addEventListener('loadedmetadata', setTimeHandler);
    }
    
    updateDSP();
}

function togglePlay() {
    if (currentSongIndex === -1 && filteredSongs.length > 0) {
        playSongAtIndex(0);
        return;
    }
    
    if (isPlaying) {
        audioEl.pause();
    } else {
        if (!audioSource) {
            initAudio();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        audioEl.play().catch(() => {});
    }
}

function stopSong() {
    audioEl.pause();
    audioEl.currentTime = 0;
    seekSlider.value = 0;
    timeCurrent.textContent = "0:00";
    playerStatus.textContent = i18n[currentLang].status_ready;
    localStorage.setItem('xp_player_saved_time', '0');
}

function nextSong() {
    if (filteredSongs.length === 0) return;
    
    let nextIndex = 0;
    if (isShuffle) {
        nextIndex = Math.floor(Math.random() * filteredSongs.length);
    } else {
        nextIndex = currentSongIndex + 1;
        if (nextIndex >= filteredSongs.length) {
            nextIndex = 0;
        }
    }
    playSongAtIndex(nextIndex);
}

function prevSong() {
    if (filteredSongs.length === 0) return;
    
    let prevIndex = 0;
    if (isShuffle) {
        prevIndex = Math.floor(Math.random() * filteredSongs.length);
    } else {
        prevIndex = currentSongIndex - 1;
        if (prevIndex < 0) {
            prevIndex = filteredSongs.length - 1;
        }
    }
    playSongAtIndex(prevIndex);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('shuffle-indicator').textContent = isShuffle ? i18n[currentLang].on : i18n[currentLang].off;
}

// Repeat Mode
function toggleRepeat() {
    isRepeat = !isRepeat;
    document.getElementById('repeat-indicator').textContent = isRepeat ? i18n[currentLang].on : i18n[currentLang].off;
}

// CANVAS VISUALIZER DRAW LOOP
function startVisualizer() {
    if (animationId) cancelAnimationFrame(animationId);
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        
        const width = canvas.width;
        const height = canvas.height;
        
        canvasCtx.fillStyle = '#080808';
        canvasCtx.fillRect(0, 0, width, height);

        if (!analyserNode || !isPlaying) {
            canvasCtx.strokeStyle = '#005500';
            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, height / 2);
            canvasCtx.lineTo(width, height / 2);
            canvasCtx.stroke();
            return;
        }

        const bufferLength = analyserNode.frequencyBinCount;
        
        if (visualizerMode === 'bars') {
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);

            const barWidth = (width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                const green = 255;
                const red = Math.min(255, (dataArray[i] / 255) * 350);
                canvasCtx.fillStyle = `rgb(${red}, ${green}, 0)`;
                
                canvasCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

                x += barWidth;
            }
        } else {
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteTimeDomainData(dataArray);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#00ff00';
            canvasCtx.shadowBlur = 4;
            canvasCtx.shadowColor = '#00ff00';
            
            canvasCtx.beginPath();

            const sliceWidth = width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(width, height / 2);
            canvasCtx.stroke();
            canvasCtx.shadowBlur = 0;
        }
    }
    
    draw();
}

document.getElementById('btn-vis-bars').addEventListener('click', () => {
    visualizerMode = 'bars';
    document.getElementById('btn-vis-bars').classList.add('active');
    document.getElementById('btn-vis-wave').classList.remove('active');
});

document.getElementById('btn-vis-wave').addEventListener('click', () => {
    visualizerMode = 'wave';
    document.getElementById('btn-vis-wave').classList.add('active');
    document.getElementById('btn-vis-bars').classList.remove('active');
});

// DESKTOP INTERACTIVITY (Icons clicking and start menu)
function setupDesktopEvents() {
    const icons = document.querySelectorAll('.desktop-icon');
    
    desktop.addEventListener('click', (e) => {
        if (e.target.id === 'desktop') {
            icons.forEach(ico => ico.classList.remove('selected'));
            startMenu.classList.add('hidden');
        }
    });

    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            icons.forEach(ico => ico.classList.remove('selected'));
            icon.classList.add('selected');
            startMenu.classList.add('hidden');
        });

        icon.addEventListener('dblclick', () => {
            const targetId = icon.getAttribute('data-target');
            if (targetId) {
                openWindow(targetId);
            } else {
                playSystemSound(XP_ERROR_URL);
                if (icon.id === 'icon-recycle') {
                    showErrorDialog(i18n[currentLang].recycle_empty);
                } else if (icon.id === 'icon-mycomputer') {
                    showErrorDialog(i18n[currentLang].computer_denied);
                }
            }
        });
    });
}

function toggleStartMenu() {
    startMenu.classList.toggle('hidden');
}

function shutdownVirtualPC() {
    playSystemSound(XP_ERROR_URL);
    if (confirm(i18n[currentLang].confirm_shutdown)) {
        document.body.innerHTML = `
            <div style="background-color:#000000; width:100vw; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#dedede; font-family:'Courier New', monospace; font-size:14px; text-align:center; padding: 20px;">
                <p style="margin-bottom: 20px;">${i18n[currentLang].shutdown_text}</p>
                <button onclick="location.reload()" style="background:#222; border:1px solid #777; color:#fff; padding:6px 12px; cursor:pointer;">${i18n[currentLang].btn_restart}</button>
            </div>
        `;
    }
}

// SYSTEM SOUND PLAYER
function playSystemSound(url) {
    const sysAudio = new Audio(url);
    sysAudio.volume = 0.5;
    sysAudio.play().catch(err => {
        console.warn("System sound blocked:", err);
    });
}

// ERROR DIALOG
function showErrorDialog(msg) {
    const errorWin = document.getElementById('error-dialog');
    const errorMsg = document.getElementById('error-message');
    errorMsg.textContent = msg;
    errorWin.classList.remove('hidden');
    errorWin.classList.add('active');
}

function closeErrorDialog() {
    document.getElementById('error-dialog').classList.add('hidden');
}

// Menu view option toggler
function toggleSection(id) {
    const el = document.getElementById(id);
    if (el) {
        if (el.style.display === 'none') {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    }
}

// Play XP Startup Sound on the very first click or keypress on the page
function playStartupOnce() {
    if (!startupPlayed) {
        playSystemSound(XP_STARTUP_URL);
        startupPlayed = true;
        
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            try {
                audioCtx = new AudioContextClass();
            } catch(e) {}
        }
        
        document.removeEventListener('click', playStartupOnce);
        document.removeEventListener('keydown', playStartupOnce);
    }
}

document.addEventListener('click', playStartupOnce);
document.addEventListener('keydown', playStartupOnce);

/* ==========================================================================
   MINESWEEPER LOGIC
   ========================================================================= */
let msRows = 9;
let msCols = 9;
let msMinesCount = 10;
let msGrid = [];
let msMinesLeft = 10;
let msTimer = 0;
let msTimerInterval = null;
let msFirstClick = true;
let msGameOver = false;

function initMinesweeper() {
    resetMinesweeper();
}

function resetMinesweeper() {
    msMinesLeft = msMinesCount;
    msTimer = 0;
    msFirstClick = true;
    msGameOver = false;
    
    if (msTimerInterval) {
        clearInterval(msTimerInterval);
        msTimerInterval = null;
    }
    
    document.getElementById('mines-counter').textContent = String(msMinesLeft).padStart(3, '0');
    document.getElementById('mines-timer').textContent = "000";
    document.getElementById('smiley-face').textContent = "🙂";
    
    const board = document.getElementById('minesweeper-board');
    board.innerHTML = '';
    msGrid = [];
    
    for (let r = 0; r < msRows; r++) {
        msGrid[r] = [];
        for (let c = 0; c < msCols; c++) {
            const tile = {
                r: r,
                c: c,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                count: 0,
                el: null
            };
            
            const tileEl = document.createElement('div');
            tileEl.className = 'tile unrevealed';
            tileEl.dataset.row = r;
            tileEl.dataset.col = c;
            
            // Left click
            tileEl.addEventListener('click', () => {
                if (msGameOver || tile.isFlagged) return;
                if (msFirstClick) {
                    msFirstClick = false;
                    placeMines(r, c);
                    startMinesweeperTimer();
                }
                revealTile(r, c);
            });
            
            // Right click (Flag)
            tileEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (msGameOver || tile.isRevealed) return;
                toggleFlag(tile);
            });
            
            tile.el = tileEl;
            board.appendChild(tileEl);
            msGrid[r][c] = tile;
        }
    }
}

function startMinesweeperTimer() {
    msTimerInterval = setInterval(() => {
        msTimer++;
        if (msTimer > 999) msTimer = 999;
        document.getElementById('mines-timer').textContent = String(msTimer).padStart(3, '0');
    }, 1000);
}

function placeMines(startR, startC) {
    let placed = 0;
    while (placed < msMinesCount) {
        const r = Math.floor(Math.random() * msRows);
        const c = Math.floor(Math.random() * msCols);
        
        // Don't place a mine on starting tile or its immediate neighbors
        const isStartOrNeighbor = Math.abs(r - startR) <= 1 && Math.abs(c - startC) <= 1;
        
        if (!msGrid[r][c].isMine && !isStartOrNeighbor) {
            msGrid[r][c].isMine = true;
            placed++;
        }
    }
    
    // Calculate neighbor counts
    for (let r = 0; r < msRows; r++) {
        for (let c = 0; c < msCols; c++) {
            if (msGrid[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < msRows && nc >= 0 && nc < msCols) {
                        if (msGrid[nr][nc].isMine) count++;
                    }
                }
            }
            msGrid[r][c].count = count;
        }
    }
}

function revealTile(r, c) {
    const tile = msGrid[r][c];
    if (tile.isRevealed || tile.isFlagged) return;
    
    tile.isRevealed = true;
    tile.el.className = 'tile revealed';
    
    if (tile.isMine) {
        // Exploded! Game Over
        tile.el.classList.add('mine-exploded');
        tile.el.textContent = '💣';
        gameOverMinesweeper(false);
        return;
    }
    
    if (tile.count > 0) {
        tile.el.textContent = tile.count;
        tile.el.classList.add(`n-${tile.count}`);
    } else {
        // Flood fill empty neighbors
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < msRows && nc >= 0 && nc < msCols) {
                    revealTile(nr, nc);
                }
            }
        }
    }
    
    checkMinesweeperWin();
}

function toggleFlag(tile) {
    if (tile.isRevealed) return;
    tile.isFlagged = !tile.isFlagged;
    
    if (tile.isFlagged) {
        tile.el.className = 'tile unrevealed flagged';
        tile.el.textContent = '🚩';
        msMinesLeft--;
    } else {
        tile.el.className = 'tile unrevealed';
        tile.el.textContent = '';
        msMinesLeft++;
    }
    document.getElementById('mines-counter').textContent = String(Math.max(0, msMinesLeft)).padStart(3, '0');
}

function checkMinesweeperWin() {
    let unrevealedCount = 0;
    for (let r = 0; r < msRows; r++) {
        for (let c = 0; c < msCols; c++) {
            if (!msGrid[r][c].isRevealed) {
                unrevealedCount++;
            }
        }
    }
    if (unrevealedCount === msMinesCount) {
        gameOverMinesweeper(true);
    }
}

function gameOverMinesweeper(isWin) {
    msGameOver = true;
    if (msTimerInterval) {
        clearInterval(msTimerInterval);
        msTimerInterval = null;
    }
    
    // Reveal all mines
    for (let r = 0; r < msRows; r++) {
        for (let c = 0; c < msCols; c++) {
            const tile = msGrid[r][c];
            if (tile.isMine) {
                if (isWin) {
                    if (!tile.isFlagged) {
                        tile.isFlagged = true;
                        tile.el.className = 'tile unrevealed flagged';
                        tile.el.textContent = '🚩';
                    }
                } else {
                    if (!tile.isRevealed && !tile.isFlagged) {
                        tile.el.className = 'tile revealed mine';
                        tile.el.textContent = '💣';
                    }
                }
            } else if (tile.isFlagged && !tile.isMine) {
                // Incorrect flag
                tile.el.textContent = '❌';
            }
        }
    }
    
    if (isWin) {
        document.getElementById('smiley-face').textContent = "😎";
        document.getElementById('mines-counter').textContent = "000";
    } else {
        document.getElementById('smiley-face').textContent = "😵";
        playSystemSound(XP_ERROR_URL);
    }
}

/* ==========================================================================
   PAINT LOGIC
   ========================================================================== */
let paintCanvas = null;
let paintCtx = null;
let paintTool = 'pencil';
let paintIsDrawing = false;
let paintFgColor = '#000000';
let paintBgColor = '#ffffff';
let paintBrushSize = 2;
let paintStartX = 0;
let paintStartY = 0;
let paintUndoStack = [];
const paintMaxUndo = 10;
let paintTempImgData = null;

const PAINT_PALETTE_COLORS = [
    '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff8000', '#ff8080'
];

function initPaint() {
    paintCanvas = document.getElementById('paint-canvas');
    paintCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
    
    // Set initial canvas color to white
    paintCtx.fillStyle = '#ffffff';
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
    
    // Populate palette
    const palette = document.querySelector('.paint-palette');
    palette.innerHTML = '';
    PAINT_PALETTE_COLORS.forEach(color => {
        const box = document.createElement('div');
        box.className = 'color-box';
        box.style.backgroundColor = color;
        
        // Left click: set FG color
        box.addEventListener('click', () => {
            paintFgColor = color;
            document.getElementById('paint-fg-color').style.backgroundColor = color;
        });
        
        // Right click: set BG color
        box.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            paintBgColor = color;
            document.getElementById('paint-bg-color').style.backgroundColor = color;
        });
        
        palette.appendChild(box);
    });
    
    // Register mouse canvas events
    paintCanvas.addEventListener('mousedown', (e) => {
        const rect = paintCanvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        savePaintState();
        paintIsDrawing = true;
        paintStartX = x;
        paintStartY = y;
        paintCtx.beginPath();
        paintCtx.moveTo(x, y);
        
        // Configure styles
        paintCtx.strokeStyle = (paintTool === 'eraser') ? paintBgColor : paintFgColor;
        paintCtx.fillStyle = paintFgColor;
        paintCtx.lineWidth = (paintTool === 'pencil') ? 1 : paintBrushSize;
        if (paintTool === 'eraser') paintCtx.lineWidth = paintBrushSize * 3;
        paintCtx.lineCap = (paintTool === 'eraser') ? 'square' : 'round';
        paintCtx.lineJoin = 'round';
        
        if (paintTool === 'bucket') {
            paintIsDrawing = false;
            paintFloodFill(x, y, paintFgColor);
        } else if (paintTool === 'picker') {
            paintIsDrawing = false;
            const imgData = paintCtx.getImageData(x, y, 1, 1);
            const r = imgData.data[0];
            const g = imgData.data[1];
            const b = imgData.data[2];
            const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            paintFgColor = hex;
            document.getElementById('paint-fg-color').style.backgroundColor = hex;
        } else if (paintTool === 'line' || paintTool === 'rect' || paintTool === 'circle') {
            paintTempImgData = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
        } else if (paintTool === 'pencil' || paintTool === 'brush' || paintTool === 'eraser') {
            // Draw initial point
            paintCtx.lineTo(x, y);
            paintCtx.stroke();
        }
    });
    
    paintCanvas.addEventListener('mousemove', (e) => {
        if (!paintIsDrawing) return;
        
        const rect = paintCanvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        if (paintTool === 'pencil' || paintTool === 'brush' || paintTool === 'eraser') {
            paintCtx.lineTo(x, y);
            paintCtx.stroke();
        } else if (paintTool === 'line' || paintTool === 'rect' || paintTool === 'circle') {
            // Restore previous canvas state and draw rubber-band preview
            paintCtx.putImageData(paintTempImgData, 0, 0);
            paintCtx.beginPath();
            
            if (paintTool === 'line') {
                paintCtx.moveTo(paintStartX, paintStartY);
                paintCtx.lineTo(x, y);
                paintCtx.stroke();
            } else if (paintTool === 'rect') {
                paintCtx.strokeRect(paintStartX, paintStartY, x - paintStartX, y - paintStartY);
            } else if (paintTool === 'circle') {
                const radius = Math.sqrt(Math.pow(x - paintStartX, 2) + Math.pow(y - paintStartY, 2));
                paintCtx.arc(paintStartX, paintStartY, radius, 0, 2 * Math.PI);
                paintCtx.stroke();
            }
        }
    });
    
    paintCanvas.addEventListener('mouseup', () => {
        paintIsDrawing = false;
        paintTempImgData = null;
    });
    
    paintCanvas.addEventListener('mouseout', () => {
        paintIsDrawing = false;
        paintTempImgData = null;
    });
    
    // Add hotkeys for Paint
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z Undo
        if (e.ctrlKey && e.key === 'z') {
            const paintWin = document.getElementById('window-paint');
            if (paintWin && paintWin.classList.contains('active') && !paintWin.classList.contains('minimized')) {
                e.preventDefault();
                undoPaint();
            }
        }
    });
}

function setPaintTool(tool) {
    paintTool = tool;
    document.querySelectorAll('.paint-tool').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`tool-${tool}`);
    if (activeBtn) activeBtn.classList.add('active');
}

function setBrushSize(size, e) {
    paintBrushSize = size;
    document.querySelectorAll('.brush-size').forEach(el => el.classList.remove('active'));
    if (e && e.currentTarget) {
        e.currentTarget.classList.add('active');
    }
}

function savePaintState() {
    if (paintUndoStack.length >= paintMaxUndo) {
        paintUndoStack.shift();
    }
    paintUndoStack.push(paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
}

function undoPaint() {
    if (paintUndoStack.length > 0) {
        const state = paintUndoStack.pop();
        paintCtx.putImageData(state, 0, 0);
    }
}

function clearPaintCanvas() {
    savePaintState();
    paintCtx.fillStyle = '#ffffff';
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
}

function downloadPaintCanvas() {
    const link = document.createElement('a');
    link.download = 'untitled.png';
    link.href = paintCanvas.toDataURL();
    link.click();
}

function paintFloodFill(startX, startY, fillHex) {
    const canvasWidth = paintCanvas.width;
    const canvasHeight = paintCanvas.height;
    
    // Parse hex to RGBA
    const r = parseInt(fillHex.slice(1, 3), 16);
    const g = parseInt(fillHex.slice(3, 5), 16);
    const b = parseInt(fillHex.slice(5, 7), 16);
    const a = 255;
    
    const imgData = paintCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imgData.data;
    
    const getPixelIdx = (x, y) => (y * canvasWidth + x) * 4;
    const startIdx = getPixelIdx(startX, startY);
    
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];
    
    // If target color is already the fill color, cancel fill
    if (targetR === r && targetG === g && targetB === b && targetA === a) return;
    
    const queue = [[startX, startY]];
    while (queue.length > 0) {
        const [currX, currY] = queue.pop();
        const idx = getPixelIdx(currX, currY);
        
        if (data[idx] === targetR && data[idx + 1] === targetG && data[idx + 2] === targetB && data[idx + 3] === targetA) {
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
            
            if (currX > 0) queue.push([currX - 1, currY]);
            if (currX < canvasWidth - 1) queue.push([currX + 1, currY]);
            if (currY > 0) queue.push([currX, currY - 1]);
            if (currY < canvasHeight - 1) queue.push([currX, currY + 1]);
        }
    }
    paintCtx.putImageData(imgData, 0, 0);
}

/* ==========================================================================
   DESKTOP PET (SHIMEJI) IMPLEMENTATION
   ========================================================================== */

const PET_SPRITES = {
    idle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
        <!-- Large Red Back Bow -->
        <path d="M 10 12 L 24 20 L 38 12 L 34 26 L 14 26 Z" fill="#d32f2f"/>
        <circle cx="24" cy="20" r="3" fill="#b71c1c"/>
        <!-- Hair (Back) -->
        <path d="M 16 18 L 32 18 L 34 32 L 14 32 Z" fill="#2c1d11"/>
        <!-- Hair tubes -->
        <rect x="13" y="18" width="4" height="6" fill="#d32f2f" rx="1"/>
        <rect x="31" y="18" width="4" height="6" fill="#d32f2f" rx="1"/>
        <!-- Side hair locks -->
        <path d="M 13 24 L 17 32 L 15 32 L 13 24" fill="#2c1d11"/>
        <path d="M 35 24 L 31 32 L 33 32 L 35 24" fill="#2c1d11"/>
        <!-- Face -->
        <circle cx="24" cy="20" r="8" fill="#ffe0b2"/>
        <!-- Hair Bangs -->
        <path d="M 16 16 C 18 12, 30 12, 32 16 C 30 14, 18 14, 16 16" fill="#2c1d11"/>
        <!-- Hair center bangs detail -->
        <path d="M 22 14 L 24 18 L 26 14 Z" fill="#2c1d11"/>
        <!-- Eyes -->
        <ellipse cx="21" cy="20" rx="1" ry="2" fill="#4e342e"/>
        <ellipse cx="27" cy="20" rx="1" ry="2" fill="#4e342e"/>
        <!-- Rosy Cheeks -->
        <circle cx="18.5" cy="22" r="1" fill="#ffab91" opacity="0.8"/>
        <circle cx="29.5" cy="22" r="1" fill="#ffab91" opacity="0.8"/>
        <!-- Mouth -->
        <path d="M 23 23 Q 24 24 25 23" stroke="#4e342e" stroke-width="0.8" fill="none"/>
        <!-- Red Bow on Shirt -->
        <path d="M 21 28 L 27 28 L 24 29 Z" fill="#d32f2f"/>
        <!-- Torso / Red Vest -->
        <path d="M 20 28 L 28 28 L 30 38 L 18 38 Z" fill="#d32f2f"/>
        <!-- White Shirt Collar/Details -->
        <path d="M 22 28 L 26 28 L 24 32 Z" fill="#ffffff"/>
        <!-- White Apron/Skirt Details -->
        <path d="M 21 34 L 27 34 L 28 38 L 20 38 Z" fill="#ffffff"/>
        <!-- Detached Sleeves -->
        <rect x="14" y="29" width="4" height="8" fill="#ffffff" rx="1"/>
        <rect x="30" y="29" width="4" height="8" fill="#ffffff" rx="1"/>
        <rect x="14" y="28" width="4" height="2" fill="#d32f2f"/>
        <rect x="30" y="28" width="4" height="2" fill="#d32f2f"/>
        <!-- Hands -->
        <circle cx="16" cy="37.5" r="1.5" fill="#ffe0b2"/>
        <circle cx="32" cy="37.5" r="1.5" fill="#ffe0b2"/>
        <!-- Shoes / Feet -->
        <rect x="19" y="38" width="4" height="2" fill="#212121" rx="0.5"/>
        <rect x="25" y="38" width="4" height="2" fill="#212121" rx="0.5"/>
    </svg>`,

    walk1: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
        <!-- Large Red Back Bow -->
        <path d="M 9 12 L 23 20 L 37 12 L 33 26 L 13 26 Z" fill="#d32f2f"/>
        <circle cx="23" cy="20" r="3" fill="#b71c1c"/>
        <!-- Hair (Back) -->
        <path d="M 15 18 L 31 18 L 33 32 L 13 32 Z" fill="#2c1d11"/>
        <!-- Hair tubes -->
        <rect x="12" y="18" width="4" height="6" fill="#d32f2f" rx="1"/>
        <rect x="30" y="18" width="4" height="6" fill="#d32f2f" rx="1"/>
        <!-- Side hair locks -->
        <path d="M 12 24 L 16 32 L 14 32 L 12 24" fill="#2c1d11"/>
        <path d="M 34 24 L 30 32 L 32 32 L 34 24" fill="#2c1d11"/>
        <!-- Face -->
        <circle cx="23" cy="20" r="8" fill="#ffe0b2"/>
        <!-- Hair Bangs -->
        <path d="M 15 16 C 17 12, 29 12, 31 16 C 29 14, 17 14, 15 16" fill="#2c1d11"/>
        <!-- Hair center bangs detail -->
        <path d="M 21 14 L 23 18 L 25 14 Z" fill="#2c1d11"/>
        <!-- Eyes -->
        <ellipse cx="20" cy="20" rx="1" ry="2" fill="#4e342e"/>
        <ellipse cx="26" cy="20" rx="1" ry="2" fill="#4e342e"/>
        <!-- Rosy Cheeks -->
        <circle cx="17.5" cy="22" r="1" fill="#ffab91" opacity="0.8"/>
        <circle cx="28.5" cy="22" r="1" fill="#ffab91" opacity="0.8"/>
        <!-- Mouth -->
        <path d="M 22 23 Q 23 24 24 23" stroke="#4e342e" stroke-width="0.8" fill="none"/>
        <!-- Red Bow on Shirt -->
        <path d="M 20 28 L 26 28 L 23 29 Z" fill="#d32f2f"/>
        <!-- Torso / Red Vest -->
        <path d="M 19 28 L 27 28 L 29 38 L 17 38 Z" fill="#d32f2f"/>
        <!-- White Shirt Collar/Details -->
        <path d="M 21 28 L 25 28 L 23 32 Z" fill="#ffffff"/>
        <!-- White Apron/Skirt Details -->
        <path d="M 20 34 L 26 34 L 27 38 L 19 38 Z" fill="#ffffff"/>
        <!-- Detached Sleeves -->
        <rect x="12" y="29" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(10 14 29)"/>
        <rect x="30" y="29" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(-5 32 29)"/>
        <rect x="12" y="28" width="4" height="2" fill="#d32f2f" transform="rotate(10 14 29)"/>
        <rect x="30" y="28" width="4" height="2" fill="#d32f2f" transform="rotate(-5 32 29)"/>
        <!-- Hands -->
        <circle cx="13" cy="37" r="1.5" fill="#ffe0b2"/>
        <circle cx="31.5" cy="37.5" r="1.5" fill="#ffe0b2"/>
        <!-- Shoes / Feet -->
        <rect x="17" y="38" width="4" height="2" fill="#212121" rx="0.5" transform="rotate(15 19 39)"/>
        <rect x="24" y="38" width="4" height="2" fill="#212121" rx="0.5"/>
    </svg>`,

    walk2: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
        <!-- Large Red Back Bow -->
        <path d="M 11 12 L 25 20 L 39 12 L 35 26 L 15 26 Z" fill="#d32f2f"/>
        <circle cx="25" cy="20" r="3" fill="#b71c1c"/>
        <!-- Hair (Back) -->
        <path d="M 17 18 L 33 18 L 35 32 L 15 32 Z" fill="#2c1d11"/>
        <!-- Hair tubes -->
        <rect x="14" y="18" width="4" height="6" fill="#d32f2f" rx="1"/>
        <rect x="32" y="18" width="4" height="6" fill="#d32f2f" rx="1"/>
        <!-- Side hair locks -->
        <path d="M 14 24 L 18 32 L 16 32 L 14 24" fill="#2c1d11"/>
        <path d="M 36 24 L 32 32 L 34 32 L 36 24" fill="#2c1d11"/>
        <!-- Face -->
        <circle cx="25" cy="20" r="8" fill="#ffe0b2"/>
        <!-- Hair Bangs -->
        <path d="M 17 16 C 19 12, 31 12, 33 16 C 31 14, 19 14, 17 16" fill="#2c1d11"/>
        <!-- Hair center bangs detail -->
        <path d="M 23 14 L 25 18 L 27 14 Z" fill="#2c1d11"/>
        <!-- Eyes -->
        <ellipse cx="22" cy="20" rx="1" ry="2" fill="#4e342e"/>
        <ellipse cx="28" cy="20" rx="1" ry="2" fill="#4e342e"/>
        <!-- Rosy Cheeks -->
        <circle cx="19.5" cy="22" r="1" fill="#ffab91" opacity="0.8"/>
        <circle cx="30.5" cy="22" r="1" fill="#ffab91" opacity="0.8"/>
        <!-- Mouth -->
        <path d="M 24 23 Q 25 24 26 23" stroke="#4e342e" stroke-width="0.8" fill="none"/>
        <!-- Red Bow on Shirt -->
        <path d="M 22 28 L 28 28 L 25 29 Z" fill="#d32f2f"/>
        <!-- Torso / Red Vest -->
        <path d="M 21 28 L 29 28 L 31 38 L 19 38 Z" fill="#d32f2f"/>
        <!-- White Shirt Collar/Details -->
        <path d="M 23 28 L 27 28 L 25 32 Z" fill="#ffffff"/>
        <!-- White Apron/Skirt Details -->
        <path d="M 22 34 L 28 34 L 29 38 L 21 38 Z" fill="#ffffff"/>
        <!-- Detached Sleeves -->
        <rect x="14" y="29" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(-5 16 29)"/>
        <rect x="32" y="29" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(-10 34 29)"/>
        <rect x="14" y="28" width="4" height="2" fill="#d32f2f" transform="rotate(-5 16 29)"/>
        <rect x="32" y="28" width="4" height="2" fill="#d32f2f" transform="rotate(-10 34 29)"/>
        <!-- Hands -->
        <circle cx="15.5" cy="37.5" r="1.5" fill="#ffe0b2"/>
        <circle cx="34" cy="37" r="1.5" fill="#ffe0b2"/>
        <!-- Shoes / Feet -->
        <rect x="20" y="38" width="4" height="2" fill="#212121" rx="0.5"/>
        <rect x="27" y="38" width="4" height="2" fill="#212121" rx="0.5" transform="rotate(-15 29 39)"/>
    </svg>`,

    sit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
        <!-- Large Red Back Bow -->
        <path d="M 10 14 L 24 21 L 38 14 L 34 27 L 14 27 Z" fill="#d32f2f"/>
        <circle cx="24" cy="21" r="3" fill="#b71c1c"/>
        <!-- Hair (Back) -->
        <path d="M 16 19 L 32 19 L 34 33 L 14 33 Z" fill="#2c1d11"/>
        <!-- Hair tubes -->
        <rect x="13" y="19" width="4" height="6" fill="#d32f2f" rx="1"/>
        <rect x="31" y="19" width="4" height="6" fill="#d32f2f" rx="1"/>
        <!-- Side hair locks -->
        <path d="M 13 25 L 17 33 L 15 33 L 13 25" fill="#2c1d11"/>
        <path d="M 35 25 L 31 33 L 33 33 L 35 25" fill="#2c1d11"/>
        <!-- Face -->
        <circle cx="24" cy="21" r="8" fill="#ffe0b2"/>
        <!-- Hair Bangs -->
        <path d="M 16 17 C 18 13, 30 13, 32 17 C 30 15, 18 15, 16 17" fill="#2c1d11"/>
        <!-- Hair center bangs detail -->
        <path d="M 22 15 L 24 19 L 26 15 Z" fill="#2c1d11"/>
        <!-- Eyes -->
        <path d="M 19.5 21 Q 21 22 22.5 21" stroke="#4e342e" stroke-width="1.2" fill="none"/>
        <path d="M 25.5 21 Q 27 22 28.5 21" stroke="#4e342e" stroke-width="1.2" fill="none"/>
        <!-- Rosy Cheeks -->
        <circle cx="18.5" cy="23" r="1" fill="#ffab91" opacity="0.8"/>
        <circle cx="29.5" cy="23" r="1" fill="#ffab91" opacity="0.8"/>
        <!-- Mouth -->
        <path d="M 23 24 Q 24 26 25 24 Z" fill="#e57373" stroke="#4e342e" stroke-width="0.5"/>
        <!-- Red Bow on Shirt -->
        <path d="M 21 29 L 27 29 L 24 30 Z" fill="#d32f2f"/>
        <!-- Torso / Red Vest -->
        <path d="M 20 29 L 28 29 L 29 38 L 19 38 Z" fill="#d32f2f"/>
        <!-- White Shirt Collar/Details -->
        <path d="M 22 29 L 26 29 L 24 33 Z" fill="#ffffff"/>
        <!-- White Apron/Skirt -->
        <path d="M 18 38 C 18 36, 30 36, 30 38 L 32 40 L 16 40 Z" fill="#ffffff"/>
        <path d="M 16 40 L 32 40 L 34 42 L 14 42 Z" fill="#d32f2f"/>
        <!-- Detached Sleeves -->
        <rect x="15" y="30" width="4" height="6" fill="#ffffff" rx="1" transform="rotate(-30 17 30)"/>
        <rect x="29" y="30" width="4" height="6" fill="#ffffff" rx="1" transform="rotate(30 31 30)"/>
        <!-- Hands holding cup -->
        <circle cx="20" cy="34" r="1.5" fill="#ffe0b2"/>
        <circle cx="28" cy="34" r="1.5" fill="#ffe0b2"/>
        <!-- Tea Cup -->
        <path d="M 22 34 L 26 34 L 25.5 37 L 22.5 37 Z" fill="#e0e0e0"/>
        <ellipse cx="24" cy="34" rx="2" ry="0.6" fill="#81c784"/>
        <!-- Steam -->
        <path d="M 23.5 32 Q 24 30 24.5 31 T 25 29" stroke="#ffffff" stroke-width="0.8" fill="none" opacity="0.7"/>
    </svg>`,

    climb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
        <!-- Large Red Back Bow -->
        <path d="M 12 12 L 22 20 L 32 14 L 30 26 L 16 26 Z" fill="#d32f2f"/>
        <!-- Hair (Back) -->
        <path d="M 18 18 L 32 18 L 30 34 L 16 34 Z" fill="#2c1d11"/>
        <!-- Hair tubes -->
        <rect x="15" y="18" width="3" height="6" fill="#d32f2f" rx="1"/>
        <!-- Side hair locks -->
        <path d="M 15 24 L 18 32 L 16 32 Z" fill="#2c1d11"/>
        <!-- Face -->
        <circle cx="26" cy="20" r="8" fill="#ffe0b2"/>
        <!-- Hair side/back detail -->
        <path d="M 20 14 C 22 12, 28 12, 30 16" stroke="#2c1d11" stroke-width="2" fill="none"/>
        <ellipse cx="28" cy="20" rx="1" ry="2" fill="#4e342e"/>
        <!-- Rosy Cheek -->
        <circle cx="30" cy="22" r="1" fill="#ffab91" opacity="0.8"/>
        <!-- Torso / Red Vest -->
        <path d="M 20 28 L 28 28 L 29 38 L 19 38 Z" fill="#d32f2f"/>
        <!-- White Apron/Skirt -->
        <path d="M 20 34 L 28 34 L 29 38 L 19 38 Z" fill="#ffffff"/>
        <!-- Arms -->
        <rect x="28" y="24" width="8" height="3" fill="#ffffff" rx="1" transform="rotate(-15 28 24)"/>
        <circle cx="36" cy="22" r="1.5" fill="#ffe0b2"/>
        <rect x="16" y="27" width="6" height="3" fill="#ffffff" rx="1" transform="rotate(30 16 27)"/>
        <circle cx="14" cy="30" r="1.5" fill="#ffe0b2"/>
        <!-- Shoes / Feet -->
        <rect x="18" y="38" width="4" height="2" fill="#212121" rx="0.5" transform="rotate(20 20 39)"/>
        <rect x="25" y="38" width="4" height="2" fill="#212121" rx="0.5" transform="rotate(-10 27 39)"/>
    </svg>`,

    fall: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
        <!-- Large Red Back Bow -->
        <path d="M 8 10 L 24 18 L 40 10 L 35 24 L 13 24 Z" fill="#d32f2f"/>
        <circle cx="24" cy="18" r="3" fill="#b71c1c"/>
        <!-- Hair (Back) -->
        <path d="M 16 16 C 12 28, 36 28, 32 16" fill="#2c1d11"/>
        <!-- Hair tubes -->
        <rect x="13" y="14" width="4" height="6" fill="#d32f2f" rx="1" transform="rotate(-10 15 17)"/>
        <rect x="31" y="14" width="4" height="6" fill="#d32f2f" rx="1" transform="rotate(10 33 17)"/>
        <!-- Face -->
        <circle cx="24" cy="18" r="8" fill="#ffe0b2"/>
        <!-- Hair Bangs -->
        <path d="M 16 14 C 18 10, 30 10, 32 14" fill="#2c1d11"/>
        <!-- Eyes -->
        <circle cx="21" cy="18" r="1.5" fill="#ffe0b2" stroke="#4e342e" stroke-width="1"/>
        <circle cx="21" cy="18" r="0.5" fill="#4e342e"/>
        <circle cx="27" cy="18" r="1.5" fill="#ffe0b2" stroke="#4e342e" stroke-width="1"/>
        <circle cx="27" cy="18" r="0.5" fill="#4e342e"/>
        <!-- Rosy Cheeks -->
        <circle cx="18.5" cy="20" r="1" fill="#ffab91" opacity="0.8"/>
        <circle cx="29.5" cy="20" r="1" fill="#ffab91" opacity="0.8"/>
        <!-- Mouth -->
        <ellipse cx="24" cy="22" rx="1.5" ry="2" fill="#e57373" stroke="#4e342e" stroke-width="0.5"/>
        <!-- Red Bow on Shirt -->
        <path d="M 21 26 L 27 26 L 24 27 Z" fill="#d32f2f"/>
        <!-- Torso / Red Vest -->
        <path d="M 20 26 L 28 26 L 30 36 L 18 36 Z" fill="#d32f2f"/>
        <!-- White Apron/Skirt -->
        <path d="M 16 36 C 14 32, 34 32, 32 36 Z" fill="#ffffff"/>
        <!-- Detached Sleeves -->
        <rect x="13" y="22" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(-30 15 22)"/>
        <rect x="31" y="22" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(30 33 22)"/>
        <!-- Hands -->
        <circle cx="11.5" cy="19" r="1.5" fill="#ffe0b2"/>
        <circle cx="36.5" cy="19" r="1.5" fill="#ffe0b2"/>
        <!-- Shoes / Feet -->
        <rect x="19" y="38" width="3" height="3" fill="#212121" rx="0.5" transform="rotate(10 20 39)"/>
        <rect x="26" y="38" width="3" height="3" fill="#212121" rx="0.5" transform="rotate(-10 27 39)"/>
    </svg>`,

    drag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
        <!-- Large Red Back Bow -->
        <path d="M 8 10 L 24 18 L 40 10 L 35 24 L 13 24 Z" fill="#d32f2f"/>
        <circle cx="24" cy="18" r="3" fill="#b71c1c"/>
        <!-- Hair (Back) -->
        <path d="M 15 16 C 11 28, 37 28, 33 16" fill="#2c1d11"/>
        <!-- Hair tubes -->
        <rect x="13" y="14" width="4" height="6" fill="#d32f2f" rx="1"/>
        <rect x="31" y="14" width="4" height="6" fill="#d32f2f" rx="1"/>
        <!-- Face -->
        <circle cx="24" cy="18" r="8" fill="#ffe0b2"/>
        <!-- Hair Bangs -->
        <path d="M 16 14 C 18 10, 30 10, 32 14" fill="#2c1d11"/>
        <!-- Eyes -->
        <path d="M 19.5 16.5 L 22.5 19.5 M 22.5 16.5 L 19.5 19.5" stroke="#4e342e" stroke-width="1.2"/>
        <path d="M 25.5 16.5 L 28.5 19.5 M 28.5 16.5 L 25.5 19.5" stroke="#4e342e" stroke-width="1.2"/>
        <!-- Rosy Cheeks -->
        <circle cx="18.5" cy="21" r="1" fill="#ffab91" opacity="0.8"/>
        <circle cx="29.5" cy="21" r="1" fill="#ffab91" opacity="0.8"/>
        <!-- Mouth -->
        <path d="M 22 22 Q 24 20 26 22" stroke="#4e342e" stroke-width="1" fill="none"/>
        <!-- Red Bow on Shirt -->
        <path d="M 21 26 L 27 26 L 24 27 Z" fill="#d32f2f"/>
        <!-- Torso / Red Vest -->
        <path d="M 20 26 L 28 26 L 29 38 L 19 38 Z" fill="#d32f2f"/>
        <!-- White Apron/Skirt -->
        <path d="M 17 36 C 15 32, 33 32, 31 36 Z" fill="#ffffff"/>
        <!-- Detached Sleeves -->
        <rect x="14" y="27" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(15 16 27)"/>
        <rect x="30" y="27" width="4" height="8" fill="#ffffff" rx="1" transform="rotate(-15 32 27)"/>
        <!-- Hands dangling -->
        <circle cx="13" cy="35" r="1.5" fill="#ffe0b2"/>
        <circle cx="35" cy="35" r="1.5" fill="#ffe0b2"/>
        <!-- Shoes / Feet -->
        <rect x="18" y="39" width="3" height="3" fill="#212121" rx="0.5" transform="rotate(30 19 40)"/>
        <rect x="27" y="39" width="3" height="3" fill="#212121" rx="0.5" transform="rotate(-30 28 40)"/>
    </svg>`
};

class Shimeji {
    constructor() {
        this.element = document.getElementById('desktop-pet');
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.id = 'desktop-pet';
            document.body.appendChild(this.element);
        }
        
        this.element.style.touchAction = 'none';
        
        this.x = Math.random() * (window.innerWidth - 100) + 50;
        this.y = 50;
        this.vx = 0;
        this.vy = 0;
        this.state = 'fall';
        this.direction = Math.random() < 0.5 ? 1 : -1;
        this.isDragging = false;
        
        this.attachedPlatform = null;
        this.lastPlatformRect = null;
        
        this.frame = 'fall';
        this.animTimer = 0;
        this.behaviorTimer = performance.now() + 2000;
        this.lastTime = performance.now();
        this.animFrameIndex = 0;
        this.prevState = 'fall';
        
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.lastMouseTime = 0;
        
        this.setupEvents();
    }
    
    setupEvents() {
        this.onPointerDown = (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.state = 'drag';
            this.frame = 'drag';
            this.element.classList.add('dragging');
            
            this.element.setPointerCapture(e.pointerId);
            
            this.dragOffsetX = e.clientX - this.x;
            this.dragOffsetY = e.clientY - this.y;
            
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.lastMouseTime = performance.now();
            this.vx = 0;
            this.vy = 0;
            
            this.attachedPlatform = null;
            this.lastPlatformRect = null;
        };
        
        this.onPointerMove = (e) => {
            if (!this.isDragging) return;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            if (e.clientX > this.lastMouseX) {
                this.direction = 1;
            } else if (e.clientX < this.lastMouseX) {
                this.direction = -1;
            }
        };
        
        this.onPointerUp = (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.element.classList.remove('dragging');
            try {
                this.element.releasePointerCapture(e.pointerId);
            } catch (err) {}
            
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > 1.5) {
                this.state = 'fall';
                this.frame = 'fall';
            } else {
                this.state = 'fall';
                this.frame = 'fall';
                this.vx = 0;
                this.vy = 0;
            }
        };
        
        this.element.addEventListener('pointerdown', this.onPointerDown);
        this.element.addEventListener('pointermove', this.onPointerMove);
        this.element.addEventListener('pointerup', this.onPointerUp);
        this.element.style.display = 'block';
    }
    
    getPlatforms() {
        const platforms = [];
        const windows = document.querySelectorAll('.xp-window');
        windows.forEach(win => {
            if (!win.classList.contains('minimized') && win.style.display !== 'none' && win.offsetWidth > 0) {
                const rect = win.getBoundingClientRect();
                platforms.push({
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.top + 30,
                    element: win
                });
            }
        });
        return platforms;
    }
    
    chooseBehavior() {
        if (this.state === 'climb') {
            const rand = Math.random();
            if (rand < 0.6) {
                this.vy = -0.8;
                this.behaviorTimer = performance.now() + Math.random() * 2000 + 1000;
            } else {
                this.state = 'fall';
                this.frame = 'fall';
                this.vy = -1.5;
                this.vx = -this.direction * 2;
                this.attachedPlatform = null;
            }
            return;
        }
        
        const rand = Math.random();
        if (rand < 0.4) {
            this.state = 'idle';
            this.vx = 0;
            this.vy = 0;
            this.behaviorTimer = performance.now() + Math.random() * 3000 + 2000;
        } else if (rand < 0.8) {
            this.direction = Math.random() < 0.5 ? 1 : -1;
            this.state = 'walk';
            this.vx = this.direction * 1.0;
            this.vy = 0;
            this.behaviorTimer = performance.now() + Math.random() * 3000 + 2000;
        } else {
            this.state = 'sit';
            this.vx = 0;
            this.vy = 0;
            this.behaviorTimer = performance.now() + Math.random() * 4000 + 2000;
        }
    }
    
    update() {
        const now = performance.now();
        const dt = Math.min(now - this.lastTime, 100);
        this.lastTime = now;
        
        if (this.isDragging) {
            const dt_ms = now - this.lastMouseTime;
            if (dt_ms > 0) {
                const instantVx = (this.mouseX - this.lastMouseX) / dt_ms * 16.666;
                const instantVy = (this.mouseY - this.lastMouseY) / dt_ms * 16.666;
                
                this.vx = 0.6 * this.vx + 0.4 * instantVx;
                this.vy = 0.6 * this.vy + 0.4 * instantVy;
                
                const maxVel = 25;
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > maxVel) {
                    this.vx = (this.vx / speed) * maxVel;
                    this.vy = (this.vy / speed) * maxVel;
                }
            }
            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
            this.lastMouseTime = now;
            
            this.x = this.mouseX - this.dragOffsetX;
            this.y = this.mouseY - this.dragOffsetY;
            
            this.x = Math.max(0, Math.min(window.innerWidth - PET_SIZE_W, this.x));
            this.y = Math.max(0, Math.min(window.innerHeight - 30 - PET_SIZE_H, this.y));
            
            this.attachedPlatform = null;
            this.lastPlatformRect = null;
            this.state = 'drag';
            this.frame = 'drag';
        } else {
            if (this.attachedPlatform) {
                const isAttachedInDOM = document.body.contains(this.attachedPlatform);
                const isMinimized = this.attachedPlatform.classList.contains('minimized');
                const isHidden = this.attachedPlatform.style.display === 'none';
                
                if (!isAttachedInDOM || isMinimized || isHidden) {
                    this.attachedPlatform = null;
                    this.lastPlatformRect = null;
                    this.state = 'fall';
                } else {
                    const rect = this.attachedPlatform.getBoundingClientRect();
                    if (this.lastPlatformRect) {
                        const dx = rect.left - this.lastPlatformRect.left;
                        const dy = rect.top - this.lastPlatformRect.top;
                        this.x += dx;
                        this.y += dy;
                    }
                    this.lastPlatformRect = rect;
                    
                    const center = this.x + (PET_SIZE_W / 2);
                    if (center < rect.left || center > rect.right) {
                        this.attachedPlatform = null;
                        this.lastPlatformRect = null;
                        this.state = 'fall';
                    }
                }
            }
            
            // Movement physics depending on the state
            if (this.state === 'climb') {
                this.y += this.vy;
                if (this.y <= 0) {
                    this.y = 0;
                    this.state = 'fall';
                    this.vy = 0;
                    this.vx = -this.direction * 1.5;
                }
            } else if (this.state === 'walk') {
                this.x += this.vx;
                
                if (this.attachedPlatform) {
                    const rect = this.lastPlatformRect;
                    const center = this.x + (PET_SIZE_W / 2);
                    if (center < rect.left + 5 && this.direction === -1) {
                        if (Math.random() < 0.6) {
                            this.direction = 1;
                            this.vx = 1.0;
                            this.x = rect.left - (PET_SIZE_W / 2) + 6;
                        }
                    } else if (center > rect.right - 5 && this.direction === 1) {
                        if (Math.random() < 0.6) {
                            this.direction = -1;
                            this.vx = -1.0;
                            this.x = rect.right - (PET_SIZE_W / 2) - 6;
                        }
                    }
                } else {
                    const floorY = window.innerHeight - 30 - PET_SIZE_H;
                    if (this.y < floorY) {
                        this.state = 'fall';
                    } else {
                        this.y = floorY;
                        this.vy = 0;
                        this.vx = this.direction * 1.0;
                    }
                }
            } else if (this.state === 'fall') {
                this.vy += 0.4;
                this.vx *= 0.995;
                this.vy *= 0.995;
                
                this.x += this.vx;
                this.y += this.vy;
                
                const floorY = window.innerHeight - 30 - PET_SIZE_H;
                if (this.y >= floorY) {
                    this.y = floorY;
                    if (this.vy > 3) {
                        this.vy = -this.vy * 0.35;
                        this.vx *= 0.7;
                    } else {
                        this.vy = 0;
                        this.vx = 0;
                        this.state = 'idle';
                        this.behaviorTimer = performance.now() + Math.random() * 2000 + 1000;
                    }
                }
            } else {
                // idle, sit, etc.
                this.vx = 0;
                this.vy = 0;
                if (!this.attachedPlatform) {
                    const floorY = window.innerHeight - 30 - PET_SIZE_H;
                    this.y = floorY;
                }
            }
            
            // Screen edge boundary checks
            const rightBound = window.innerWidth - PET_SIZE_W;
            if (this.x <= 0) {
                this.x = 0;
                if (Math.abs(this.vx) > 1) {
                    this.vx = -this.vx * 0.5;
                } else {
                    this.vx = 0;
                    if (this.state === 'walk') {
                        this.direction = 1;
                        this.vx = 1.0;
                    }
                }
            } else if (this.x >= rightBound) {
                this.x = rightBound;
                if (Math.abs(this.vx) > 1) {
                    this.vx = -this.vx * 0.5;
                } else {
                    this.vx = 0;
                    if (this.state === 'walk') {
                        this.direction = -1;
                        this.vx = -1.0;
                    }
                }
            }
            
            // Platform landing check while falling
            if (!this.attachedPlatform && this.state !== 'climb' && this.vy >= 0) {
                const platforms = this.getPlatforms();
                const feetY = this.y + PET_SIZE_H;
                for (let i = 0; i < platforms.length; i++) {
                    const plat = platforms[i];
                    const center = this.x + (PET_SIZE_W / 2);
                    if (center >= plat.left && center <= plat.right) {
                        const prevFeetY = feetY - this.vy;
                        if (feetY >= plat.top && prevFeetY <= plat.top + 6) {
                            this.y = plat.top - PET_SIZE_H;
                            if (this.vy > 3) {
                                this.vy = -this.vy * 0.3;
                                this.vx *= 0.7;
                            } else {
                                this.vy = 0;
                                this.vx = 0;
                                this.attachedPlatform = plat.element;
                                this.lastPlatformRect = plat.element.getBoundingClientRect();
                                this.state = 'idle';
                                this.behaviorTimer = performance.now() + Math.random() * 2000 + 1000;
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        if (!this.isDragging && this.state !== 'fall' && performance.now() > this.behaviorTimer) {
            this.chooseBehavior();
        }
        
        if (!this.isDragging && !this.attachedPlatform && this.state !== 'climb' && this.y < window.innerHeight - 30 - PET_SIZE_H) {
            if (this.vy > 0.5) {
                this.state = 'fall';
            }
        }
        
        const framesList = (typeof SPRITE_MAP !== 'undefined' && SPRITE_MAP[this.state]) || (typeof SPRITE_MAP !== 'undefined' && SPRITE_MAP['idle']) || [];
        if (this.state !== this.prevState) {
            this.animFrameIndex = 0;
            this.animTimer = 0;
            this.prevState = this.state;
        }
        
        const frameDuration = this.state === 'walk' ? 120 : 300;
        this.animTimer += dt;
        if (this.animTimer > frameDuration) {
            if (framesList.length > 0) {
                this.animFrameIndex = (this.animFrameIndex + 1) % framesList.length;
            }
            this.animTimer = 0;
        }

        if (this.state === 'walk') {
            this.frame = (this.animFrameIndex % 2 === 0) ? 'walk1' : 'walk2';
        } else {
            this.frame = this.state;
        }
        
        this.render();
    }
    
    render() {
        if (spritesImageLoaded) {
            let frames = SPRITE_MAP[this.state] || SPRITE_MAP['idle'];
            let frame = frames[this.animFrameIndex % frames.length];
            if (frame) {
                if (!this.spriteEl || this.spriteEl.tagName !== 'CANVAS') {
                    if (this.spriteEl) {
                        this.spriteEl.remove();
                    }
                    this.spriteEl = document.createElement('canvas');
                    this.spriteEl.className = 'pet-sprite';
                    this.spriteEl.style.position = 'absolute';
                    this.spriteEl.style.bottom = '0';
                    this.spriteEl.style.left = '50%';
                    this.spriteEl.style.transformOrigin = 'bottom center';
                    this.spriteEl.style.imageRendering = 'pixelated';
                    this.element.appendChild(this.spriteEl);
                }
                
                if (this.element.childNodes.length > 1 || (this.element.childNodes.length === 1 && this.element.childNodes[0] !== this.spriteEl)) {
                    this.element.innerHTML = '';
                    this.element.appendChild(this.spriteEl);
                }
                
                let currentFrame = frame;
                let isHighres = false;
                
                if (frame.type === 'highres' || frame.type === 'highres_walk' || frame.type === 'highres_fall' || frame.type === 'highres_sit') {
                    let img;
                    if (frame.type === 'highres') {
                        img = idleFrames[frame.index];
                    } else if (frame.type === 'highres_walk') {
                        img = walkFrames[frame.index];
                    } else if (frame.type === 'highres_fall') {
                        img = fallFrames[frame.index];
                    } else {
                        img = sitFrames[frame.index];
                    }
                    
                    if (img && img.complete && img.naturalWidth > 0) {
                        isHighres = true;
                        this.spriteEl.width = img.width;
                        this.spriteEl.height = img.height;
                        
                        const ctx = this.spriteEl.getContext('2d');
                        ctx.clearRect(0, 0, img.width, img.height);
                        ctx.drawImage(img, 0, 0);
                        
                        const displayH = PET_SIZE_H;
                        const displayW = (img.width / img.height) * displayH;
                        this.spriteEl.style.width = `${displayW}px`;
                        this.spriteEl.style.height = `${displayH}px`;
                    } else {
                        if (frame.type === 'highres') {
                            currentFrame = { r: 2, c: this.animFrameIndex % 4 };
                        } else if (frame.type === 'highres_walk') {
                            currentFrame = { r: 3, c: this.animFrameIndex % 6 };
                        } else if (frame.type === 'highres_fall') {
                            currentFrame = { r: 18, c: 0 };
                        } else {
                            currentFrame = { r: 19, c: this.animFrameIndex % 4 };
                        }
                    }
                }
                
                if (!isHighres) {
                    const cellW = 24;
                    const cellH = 32;
                    this.spriteEl.width = cellW;
                    this.spriteEl.height = cellH;
                    
                    const ctx = this.spriteEl.getContext('2d');
                    ctx.clearRect(0, 0, cellW, cellH);
                    
                    const sx = currentFrame.c * cellW;
                    const sy = currentFrame.r * cellH;
                    
                    ctx.drawImage(spritesImage, sx, sy, cellW, cellH, 0, 0, cellW, cellH);
                    
                    try {
                        const imgData = ctx.getImageData(0, 0, cellW, cellH);
                        const data = imgData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i+1];
                            const b = data[i+2];
                            const diff = Math.abs(r - 47) + Math.abs(g - 95) + Math.abs(b - 115);
                            if (diff < 30) {
                                data[i+3] = 0;
                            }
                        }
                        ctx.putImageData(imgData, 0, 0);
                    } catch (e) {
                        console.error("Transparency error:", e);
                    }
                    
                    const displayW = cellW * SPRITE_SCALE;
                    const displayH = cellH * SPRITE_SCALE;
                    this.spriteEl.style.width = `${displayW}px`;
                    this.spriteEl.style.height = `${displayH}px`;
                }
                
                this.spriteEl.style.display = 'block';
                
                const scaleX = this.direction === -1 ? -1 : 1;
                let rotation = 0;
                if (this.state === 'climb') {
                    rotation = this.direction === -1 ? 90 : -90;
                }
                this.spriteEl.style.transform = `translateX(-50%) scaleX(${scaleX}) rotate(${rotation}deg)`;
                
                this.element.style.backgroundImage = 'none';
                this.element.style.width = `${PET_SIZE_W}px`;
                this.element.style.height = `${PET_SIZE_H}px`;
                this.element.style.transform = 'none';
                
                this.element.style.left = `${this.x}px`;
                this.element.style.top = `${this.y}px`;
                return;
            }
        }
        
        if (this.spriteEl) {
            this.spriteEl.style.display = 'none';
        }
        this.element.style.backgroundImage = 'none';
        this.element.style.transformOrigin = 'initial';
        const svgString = PET_SPRITES[this.frame] || PET_SPRITES['idle'];
        if (this.element.innerHTML !== svgString && !this.element.querySelector('svg')) {
            this.element.innerHTML = '';
            if (this.spriteEl) this.element.appendChild(this.spriteEl);
            
            const temp = document.createElement('div');
            temp.innerHTML = svgString;
            const svgNode = temp.firstElementChild;
            this.element.insertBefore(svgNode, this.element.firstChild);
        }
        
        this.element.style.width = `${PET_SIZE_W}px`;
        this.element.style.height = `${PET_SIZE_H}px`;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        
        const transformStr = this.direction === -1 ? 'scaleX(-1)' : 'scaleX(1)';
        this.element.style.transform = transformStr;
    }
    
    destroy() {
        this.element.removeEventListener('pointerdown', this.onPointerDown);
        this.element.removeEventListener('pointermove', this.onPointerMove);
        this.element.removeEventListener('pointerup', this.onPointerUp);
        this.element.style.display = 'none';
        this.element.innerHTML = '';
        this.spriteEl = null;
    }
}

let activePet = null;
let petAnimationId = null;

function petLoop() {
    if (activePet) {
        activePet.update();
        petAnimationId = requestAnimationFrame(petLoop);
    }
}

function toggleDesktopPet() {
    if (activePet) {
        if (petAnimationId) {
            cancelAnimationFrame(petAnimationId);
            petAnimationId = null;
        }
        activePet.destroy();
        activePet = null;
    } else {
        activePet = new Shimeji();
        petLoop();
    }
}

const PET_SIZE_W = 120;
const PET_SIZE_H = 160;
const SPRITE_SCALE = 5.0;

const spritesImage = new Image();
spritesImage.src = 'reimu_sprites.png';
let spritesImageLoaded = false;
spritesImage.onload = () => {
    spritesImageLoaded = true;
};
if (spritesImage.complete) {
    spritesImageLoaded = true;
}

const idleFrames = [];
const numIdleFrames = 5;
let idleFramesLoadedCount = 0;
for (let i = 0; i < numIdleFrames; i++) {
    const img = new Image();
    img.src = `reimu_idle_${i}.png`;
    img.onload = () => {
        idleFramesLoadedCount++;
    };
    if (img.complete) {
        idleFramesLoadedCount++;
    }
    idleFrames.push(img);
}

const walkFrames = [];
const numWalkFrames = 8;
let walkFramesLoadedCount = 0;
for (let i = 0; i < numWalkFrames; i++) {
    const img = new Image();
    img.src = `reimu_walk_${i}.png`;
    img.onload = () => {
        walkFramesLoadedCount++;
    };
    if (img.complete) {
        walkFramesLoadedCount++;
    }
    walkFrames.push(img);
}

const fallFrames = [];
const numFallFrames = 1;
let fallFramesLoadedCount = 0;
for (let i = 0; i < numFallFrames; i++) {
    const img = new Image();
    img.src = `reimu_fall_${i}.png`;
    img.onload = () => {
        fallFramesLoadedCount++;
    };
    if (img.complete) {
        fallFramesLoadedCount++;
    }
    fallFrames.push(img);
}

const sitFrames = [];
const numSitFrames = 9;
let sitFramesLoadedCount = 0;
for (let i = 0; i < numSitFrames; i++) {
    const img = new Image();
    img.src = `reimu_sit_${i}.png`;
    img.onload = () => {
        sitFramesLoadedCount++;
    };
    if (img.complete) {
        sitFramesLoadedCount++;
    }
    sitFrames.push(img);
}

const SPRITE_MAP = {
    idle: [
        { type: 'highres', index: 0 },
        { type: 'highres', index: 1 },
        { type: 'highres', index: 2 },
        { type: 'highres', index: 3 },
        { type: 'highres', index: 4 }
    ],
    walk: [
        { type: 'highres_walk', index: 0 },
        { type: 'highres_walk', index: 1 },
        { type: 'highres_walk', index: 2 },
        { type: 'highres_walk', index: 3 },
        { type: 'highres_walk', index: 4 },
        { type: 'highres_walk', index: 5 },
        { type: 'highres_walk', index: 6 },
        { type: 'highres_walk', index: 7 }
    ],
    sit: [
        { type: 'highres_sit', index: 0 },
        { type: 'highres_sit', index: 1 },
        // Loop 1 (2 to 7 are seated/grounded)
        { type: 'highres_sit', index: 2 },
        { type: 'highres_sit', index: 3 },
        { type: 'highres_sit', index: 4 },
        { type: 'highres_sit', index: 5 },
        { type: 'highres_sit', index: 6 },
        { type: 'highres_sit', index: 7 },
        // Loop 2 (to extend sit duration)
        { type: 'highres_sit', index: 2 },
        { type: 'highres_sit', index: 3 },
        { type: 'highres_sit', index: 4 },
        { type: 'highres_sit', index: 5 },
        { type: 'highres_sit', index: 6 },
        { type: 'highres_sit', index: 7 }
    ],
    climb: [
        { r: 4, c: 1 },
        { r: 4, c: 2 }
    ],
    fall: [
        { type: 'highres_fall', index: 0 }
    ],
    drag: [
        { type: 'highres_fall', index: 0 }
    ]
};

