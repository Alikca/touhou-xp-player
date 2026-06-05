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

// PLAYLIST & DATA LOADING
async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) throw new Error("No se pudo cargar songs.json");
        songs = await response.json();
        
        filteredSongs = [...songs];
        
        // Populate game filter select dropdown
        const games = [...new Set(songs.map(s => s.game))].sort();
        filterSelect.innerHTML = '<option value="all">Todas las sagas</option><option value="favorites">★ Mis Favoritos</option>';
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
            // Shorten name if too long
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
    } catch (err) {
        console.error(err);
        tracksContainer.innerHTML = `<div class="loading-label" style="color:red;">Error al cargar las canciones: ${err.message}</div>`;
    }
}

function renderPlaylist() {
    tracksContainer.innerHTML = '';
    
    if (filteredSongs.length === 0) {
        tracksContainer.innerHTML = '<div class="loading-label">No se encontraron canciones</div>';
        songsCount.textContent = '0 canciones';
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
        trackItem.innerHTML = `
            <div class="track-meta">
                <span class="track-name">${song.title}</span>
                <span class="track-sub">${song.game} (${song.year})</span>
            </div>
            <span class="fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">${isFav ? '★' : '☆'}</span>
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

    songsCount.textContent = `${filteredSongs.length} canciones`;
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
    if (audioCtx) return; // already initialized

    // Create Context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

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

    // GRAPH ROUTING:
    // Source -> dryGain -> outGain
    // Source -> lowpass -> highpass -> distortion -> outGain
    // (We will use a master bypass switch. If bypassed: Source goes straight to outGain. If not: goes through filters)
    // Delay/Reverb branch out from the filtered sound or the source sound. Let's run source -> filters -> dryGain / delay / reverb.
    
    // Connections:
    audioSource.connect(lowpassFilterNode);
    lowpassFilterNode.connect(highpassFilterNode);
    highpassFilterNode.connect(distortionNode);
    
    // Connect distortion output to dry path
    distortionNode.connect(dryGain);
    
    // Connect distortion output to Delay path
    distortionNode.connect(delayNode);
    delayNode.connect(delayMixGain);
    
    // Connect distortion output to Reverb path
    distortionNode.connect(reverbNode);
    reverbNode.connect(reverbMixGain);

    // Mix dry, delay, reverb into output
    dryGain.connect(outGain);
    delayMixGain.connect(outGain);
    reverbMixGain.connect(outGain);

    // Output goes to Analyser and Speakers
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
        // Stereo random noise tail
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
        // Completely flatten/bypass DSP
        // Set filters to neutral
        lowpassFilterNode.frequency.setValueAtTime(22000, audioCtx.currentTime);
        highpassFilterNode.frequency.setValueAtTime(10, audioCtx.currentTime);
        distortionNode.curve = null;
        delayFeedbackGain.gain.setValueAtTime(0, audioCtx.currentTime);
        delayMixGain.gain.setValueAtTime(0, audioCtx.currentTime);
        reverbMixGain.gain.setValueAtTime(0, audioCtx.currentTime);
        dryGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        
        // Speed to 1
        audioEl.playbackRate = 1.0;
        document.getElementById('filter-pitch').value = 1.0;
        document.getElementById('pitch-val').textContent = "1.0x";
        return;
    }

    // 1. Pitch / Speed
    const speed = parseFloat(document.getElementById('filter-pitch').value);
    audioEl.playbackRate = speed;
    document.getElementById('pitch-val').textContent = speed.toFixed(2) + "x";

    // 2. Lowpass
    const enableLP = document.getElementById('enable-lowpass').checked;
    const lpVal = parseFloat(document.getElementById('filter-lowpass').value);
    if (enableLP) {
        lowpassFilterNode.frequency.setValueAtTime(lpVal, audioCtx.currentTime);
    } else {
        lowpassFilterNode.frequency.setValueAtTime(22000, audioCtx.currentTime); // maximum
    }

    // 3. Highpass
    const enableHP = document.getElementById('enable-highpass').checked;
    const hpVal = parseFloat(document.getElementById('filter-highpass').value);
    if (enableHP) {
        highpassFilterNode.frequency.setValueAtTime(hpVal, audioCtx.currentTime);
    } else {
        highpassFilterNode.frequency.setValueAtTime(10, audioCtx.currentTime); // minimum
    }

    // 4. Distortion
    const enableDist = document.getElementById('enable-distortion').checked;
    const distAmount = parseFloat(document.getElementById('filter-distortion').value);
    if (enableDist) {
        distortionNode.curve = makeDistortionCurve(distAmount);
    } else {
        distortionNode.curve = null;
    }

    // 5. Echo/Delay
    const enableDelay = document.getElementById('enable-delay').checked;
    const delayTime = parseFloat(document.getElementById('filter-delay-time').value);
    const delayFb = parseFloat(document.getElementById('filter-delay-feedback').value);
    
    document.getElementById('delay-time-val').textContent = delayTime.toFixed(1) + "s";
    document.getElementById('delay-feedback-val').textContent = Math.round(delayFb * 100) + "%";

    if (enableDelay) {
        delayNode.delayTime.setValueAtTime(delayTime, audioCtx.currentTime);
        delayFeedbackGain.gain.setValueAtTime(delayFb, audioCtx.currentTime);
        delayMixGain.gain.setValueAtTime(0.4, audioCtx.currentTime); // wet gain
        dryGain.gain.setValueAtTime(0.8, audioCtx.currentTime); // slight dry attenuation to prevent clip
    } else {
        delayFeedbackGain.gain.setValueAtTime(0, audioCtx.currentTime);
        delayMixGain.gain.setValueAtTime(0, audioCtx.currentTime);
        dryGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    }

    // 6. Reverb
    const enableReverb = document.getElementById('enable-reverb').checked;
    const reverbAmount = parseFloat(document.getElementById('filter-reverb').value);
    if (enableReverb) {
        // Reverb mix level
        reverbMixGain.gain.setValueAtTime((reverbAmount / 100) * 0.7, audioCtx.currentTime);
        // reduce dry gain slightly to compensate
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
    // Play/Pause
    playBtn.addEventListener('click', togglePlay);
    // Stop
    stopBtn.addEventListener('click', stopSong);
    // Next/Prev
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);

    // Audio Element Callbacks
    audioEl.addEventListener('play', () => {
        isPlaying = true;
        document.getElementById('window-player').classList.add('playing');
        playBtn.title = "Pausar";
        playBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x='6' y='5' width='4' height='14' fill='currentColor'/><rect x='14' y='5' width='4' height='14' fill='currentColor'/></svg>`;
        playerStatus.textContent = "Reproduciendo...";
        
        // Start visualizer animation
        startVisualizer();
    });

    audioEl.addEventListener('pause', () => {
        isPlaying = false;
        document.getElementById('window-player').classList.remove('playing');
        playBtn.title = "Reproducir";
        playBtn.innerHTML = `<svg viewBox="0 0 24 24" id="play-icon"><polygon points='8,5 19,12 8,19' fill='currentColor'/></svg>`;
        playerStatus.textContent = "Pausado";
    });

    audioEl.addEventListener('ended', () => {
        if (isRepeat) {
            audioEl.currentTime = 0;
            audioEl.play();
        } else {
            nextSong();
        }
    });

    // Time progress
    audioEl.addEventListener('timeupdate', () => {
        if (!isNaN(audioEl.duration)) {
            const current = audioEl.currentTime;
            const duration = audioEl.duration;
            seekSlider.value = (current / duration) * 100;
            
            // Text progress
            timeCurrent.textContent = formatTime(current);
            timeDuration.textContent = formatTime(duration);
        }
    });

    audioEl.addEventListener('durationchange', () => {
        if (!isNaN(audioEl.duration)) {
            timeDuration.textContent = formatTime(audioEl.duration);
            seekSlider.disabled = false;
        }
    });

    // Seek input
    seekSlider.addEventListener('input', () => {
        if (!isNaN(audioEl.duration)) {
            const seekTo = (seekSlider.value / 100) * audioEl.duration;
            audioEl.currentTime = seekTo;
        }
    });

    // Volume input
    volumeSlider.addEventListener('input', () => {
        const val = volumeSlider.value / 100;
        audioEl.volume = val;
        
        // save volume to localStorage
        localStorage.setItem('touhou_volume', val);
        
        // update mute icons
        updateVolumeIcon(val);
    });

    // Mute button
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            previousVolume = audioEl.volume;
            audioEl.volume = 0;
            volumeSlider.value = 0;
            muteBtn.title = "Activar sonido";
            muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z' fill='currentColor'/></svg>`;
        } else {
            audioEl.volume = previousVolume;
            volumeSlider.value = previousVolume * 100;
            muteBtn.title = "Silenciar";
            updateVolumeIcon(previousVolume);
        }
    });

    // Search and Filter inputs
    searchInput.addEventListener('input', filterPlaylist);
    filterSelect.addEventListener('change', filterPlaylist);
    document.getElementById('search-clear').addEventListener('click', () => {
        searchInput.value = '';
        filterPlaylist();
    });

    // Local file input helper
    document.getElementById('file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            
            // Add custom local song item
            const localSong = {
                id: `local_${Date.now()}`,
                game: "Archivo local",
                year: "Nuevo",
                title: file.name.replace(/\.[^/.]+$/, ""),
                duration: 0, // dynamic
                url: fileUrl,
                filename: file.name
            };

            songs.unshift(localSong);
            filteredSongs = [...songs];
            renderPlaylist();
            
            // Play it immediately
            playSongAtIndex(0);
        }
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

    // Trigger update on bypass click
    bypassCheckbox.addEventListener('change', updateDSP);

    // Trigger updates on checkboxes/sliders changes
    checkboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            // Uncheck bypass when user manually interacts with filters
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
    
    // Highlight in playlist
    document.querySelectorAll('.track-item').forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('active');
        }
    });

    // Update metadata labels
    currentTitle.textContent = song.title;
    currentGame.textContent = song.game;
    currentYear.textContent = `Año: ${song.year}`;
    playerStatus.textContent = "Cargando...";

    // Load and play audio
    audioEl.src = song.url;
    audioEl.load();

    // First time initializing Audio Context on user play action
    if (!audioCtx) {
        initAudio();
    }
    
    // Resume audio context if suspended (browser autoplay policy restriction)
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    audioEl.play().catch(err => {
        console.warn("Reproducción abortada: requiere interacción", err);
        playerStatus.textContent = "Error de reproducción";
    });

    // Update DSP nodes configurations
    updateDSP();
}

function togglePlay() {
    if (currentSongIndex === -1 && filteredSongs.length > 0) {
        // play first song if none loaded
        playSongAtIndex(0);
        return;
    }
    
    if (isPlaying) {
        audioEl.pause();
    } else {
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
    playerStatus.textContent = "Listo";
}

function nextSong() {
    if (filteredSongs.length === 0) return;
    
    let nextIndex = 0;
    if (isShuffle) {
        nextIndex = Math.floor(Math.random() * filteredSongs.length);
    } else {
        nextIndex = currentSongIndex + 1;
        if (nextIndex >= filteredSongs.length) {
            nextIndex = 0; // loop to beginning
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
            prevIndex = filteredSongs.length - 1; // loop to end
        }
    }
    playSongAtIndex(prevIndex);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('shuffle-indicator').textContent = isShuffle ? 'ON' : 'OFF';
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    document.getElementById('repeat-indicator').textContent = isRepeat ? 'ON' : 'OFF';
}

// CANVAS VISUALIZER DRAW LOOP
function startVisualizer() {
    if (animationId) cancelAnimationFrame(animationId);
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        canvasCtx.fillStyle = '#080808';
        canvasCtx.fillRect(0, 0, width, height);

        if (!analyserNode || !isPlaying) {
            // Draw dummy lines when paused or not connected
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
            // Bar graph
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);

            const barWidth = (width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Color gradient (green to yellow)
                const green = 255;
                const red = Math.min(255, (dataArray[i] / 255) * 350);
                canvasCtx.fillStyle = `rgb(${red}, ${green}, 0)`;
                
                // Draw XP-style segmented vertical bars
                canvasCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

                x += barWidth;
            }
        } else {
            // Waveform (oscilloscope)
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteTimeDomainData(dataArray);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#00ff00';
            // Neon Glow effect
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
            canvasCtx.shadowBlur = 0; // reset shadow
        }
    }
    
    draw();
}

// Toggle visualizer mode buttons
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
    
    // Select desktop icon on click
    desktop.addEventListener('click', (e) => {
        // Deselect if clicking desktop background
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

        // Double click actions
        icon.addEventListener('dblclick', () => {
            const targetId = icon.getAttribute('data-target');
            if (targetId) {
                openWindow(targetId);
            } else {
                // Show critical system error for My PC or empty Recycle bin
                playSystemSound(XP_ERROR_URL);
                if (icon.id === 'icon-recycle') {
                    showErrorDialog("La Papelera de reciclaje está vacía. No hay archivos eliminados para restaurar.");
                } else if (icon.id === 'icon-mycomputer') {
                    showErrorDialog("Acceso denegado a Mi PC: no tienes privilegios de Administrador del Servidor de Gensokyo.");
                }
            }
        });
    });
}

// Start menu trigger
function toggleStartMenu() {
    startMenu.classList.toggle('hidden');
}

// Virtual Shutdown effect
function shutdownVirtualPC() {
    playSystemSound(XP_ERROR_URL); // plays warning
    if (confirm("¿Estás seguro de que quieres apagar este PC de Gensokyo virtual?")) {
        document.body.innerHTML = `
            <div style="background-color:#000000; width:100vw; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#dedede; font-family:'Courier New', monospace; font-size:14px; text-align:center; padding: 20px;">
                <p style="margin-bottom: 20px;">Ahora puede apagar su equipo con seguridad.</p>
                <button onclick="location.reload()" style="background:#222; border:1px solid #777; color:#fff; padding:6px 12px; cursor:pointer;">Reiniciar PC</button>
            </div>
        `;
    }
}

// SYSTEM SOUND PLAYER
function playSystemSound(url) {
    // We create a temporary audio element so we don't interfere with music playing
    const sysAudio = new Audio(url);
    sysAudio.volume = 0.5;
    sysAudio.play().catch(err => {
        console.warn("Sonido del sistema bloqueado por el navegador:", err);
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

// Play XP Startup Sound on the very first click or keypress on the page (simulates boot-up)
function playStartupOnce() {
    if (!startupPlayed) {
        playSystemSound(XP_STARTUP_URL);
        startupPlayed = true;
        
        // Warm up AudioContext to satisfy browser autoplay restrictions
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            try {
                audioCtx = new AudioContextClass();
            } catch(e) {}
        }
        
        // Remove event listeners so it only runs once
        document.removeEventListener('click', playStartupOnce);
        document.removeEventListener('keydown', playStartupOnce);
    }
}

document.addEventListener('click', playStartupOnce);
document.addEventListener('keydown', playStartupOnce);

