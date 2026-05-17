let playlistData = null; // Stocke les données de la playlist en cours
let selectedBatchFormat = 'mp3_320';
let currentThumbnail = '';
let favorites = []; // Chargé depuis l'API Python au démarrage

// Pagination Recherche
let currentSearchQuery = "";
let currentOffset = 1;
let isLoadingMore = false;
const searchLimit = 15;
let lastSearchId = 0;
let userHasInteracted = false;
let searchTimeout = null;

// Hover Preview State
let hoverTimeout = null;
let currentHoverUrl = null;
let activeHoverPlayer = null;

// Gestion du Menu Déroulant
window.royoutToggleMenu = function(event) {
    if (event) event.stopPropagation(); // Empêcher la propagation au document
    const menu = document.getElementById('royout-dropdown');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Fermeture automatique du menu ou des modales quand on clique ailleurs
document.addEventListener('click', (event) => {
    const menu = document.getElementById('royout-dropdown');
    const menuBtn = document.querySelector('button[onclick*="royoutToggleMenu"]');
    
    // Fermeture du menu
    if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
            menu.classList.add('hidden');
        }
    }

    // Fermeture des modales si clic sur l'arrière-plan (backdrop)
    const modals = ['about-modal', 'faq-modal', 'support-modal', 'queue-modal', 'history-modal', 'schedule-modal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && !modal.classList.contains('hidden') && event.target === modal) {
            modal.classList.add('hidden');
            // Cas particulier pour le bouton historique qui doit changer de style
            if (id === 'history-modal') {
                const btn = document.getElementById('history-btn');
                if (btn) {
                    btn.classList.remove('text-white');
                    btn.classList.add('text-white/40');
                }
            }
        }
    });
});

// Fonctions du Menu
function selectFolder() {
    window.pywebview.api.select_folder().then(folder => {
        if (folder) {
            selectedFolder = folder;
            const msg = `Le dossier de téléchargement est maintenant : ${folder}`;
            if(window.onDownloadComplete) onDownloadComplete('success', msg);
        }
        royoutToggleMenu();
    });
}

function clearHistory() {
    document.getElementById('confirm-modal').classList.remove('hidden');
    royoutToggleMenu();
}

function closeConfirm() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

function executeClearHistory() {
    window.pywebview.api.clear_history().then(() => {
        const historyList = document.getElementById('history-list');
        if (historyList) historyList.innerHTML = '';
        closeConfirm();
        if(window.onDownloadComplete) onDownloadComplete('success', "Historique effacé avec succès !");
    });
}

function checkUpdates() {
    window.pywebview.api.open_external_link("https://royout.vercel.app/");
    royoutToggleMenu();
}

function installWindowsIntegration() {
    window.pywebview.api.install_context_menu().then(res => {
        if (res.status === 'success') {
            window.showToast(res.message);
        } else {
            alert(res.message);
        }
        royoutToggleMenu();
    });
}

function viewLogs() {
    window.pywebview.api.view_logs().then(res => {
        if (res.status === 'success') {
            window.showToast(res.message);
        }
        royoutToggleMenu();
    });
}

let isFullscreen = false;
function toggleFullscreen() {
    window.pywebview.api.toggle_fullscreen().then(() => {
        isFullscreen = !isFullscreen;
        const status = document.getElementById('fullscreen-status');
        const controls = document.getElementById('immersion-controls');
        
        if (status) {
            status.innerText = isFullscreen ? 'ON' : 'OFF';
            status.classList.toggle('text-red-500', isFullscreen);
            status.classList.toggle('text-white/20', !isFullscreen);
        }
        
        if (controls) {
            if (isFullscreen) {
                controls.classList.remove('hidden');
            } else {
                controls.classList.add('hidden');
            }
        }
        royoutToggleMenu();
    });
}

function setAppTheme(theme) {
    window.pywebview.api.set_theme(theme);
}

window.applyTheme = function(theme) {
    const indicator = document.getElementById('theme-indicator');
    
    // Reset classes
    document.body.classList.remove('bg-white', 'text-black', 'text-white');
    
    const themes = {
        'black': { bg: '#000000', text: 'white', label: 'Noir Pur' },
        'onyx': { bg: '#0a0a0a', text: 'white', label: 'Onyx' },
        'dark': { bg: '#0f0f0f', text: 'white', label: 'Sombre' },
        'charcoal': { bg: '#161616', text: 'white', label: 'Charbon' },
        'anthracite': { bg: '#1a1a1a', text: 'white', label: 'Anthracite' },
        'slate': { bg: '#262626', text: 'white', label: 'Ardoise' },
        'night': { bg: '#333333', text: 'white', label: 'Gris Nuit' },
        'metal': { bg: '#4d4d4d', text: 'white', label: 'Gris Métal' },
        'soft': { bg: '#f0f0f0', text: 'black', label: 'Gris Doux' },
        'light': { bg: '#ffffff', text: 'black', label: 'Blanc Pur' }
    };

    const config = themes[theme] || themes['dark'];
    
    document.body.style.backgroundColor = config.bg;
    document.body.classList.add(config.text === 'white' ? 'text-white' : 'text-black');
    
    if (indicator) {
        indicator.innerText = config.label;
    }

    // Gestion de l'apparence des composants (glassmorphism) selon la luminosité
    const isLight = config.text === 'black';
    document.querySelectorAll('.glass-container, #royout-dropdown, #history-modal, #queue-modal, #about-modal, #faq-modal, #support-modal, #confirm-modal, #schedule-modal').forEach(el => {
        if (isLight) {
            el.style.background = 'rgba(255, 255, 255, 0.8)';
            el.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            el.classList.add('text-black');
            el.classList.remove('text-white');
        } else {
            el.style.background = '';
            el.style.borderColor = '';
            el.classList.remove('text-black');
            // On ne force pas text-white partout car certains éléments ont des couleurs spécifiques
        }
    });

    // Ajustement spécifique pour les inputs et boutons en mode clair
    const urlInputArea = document.getElementById('url-input-area');
    const urlInput = document.getElementById('url');
    const titleBarText = document.getElementById('title-bar-text');
    const brandingDesc = document.getElementById('branding-desc');
    const historyBtn = document.getElementById('history-btn');
    const mainQueueStatus = document.getElementById('main-queue-status');

    if (urlInputArea) {
        urlInputArea.style.background = isLight ? 'rgba(0, 0, 0, 0.05)' : '';
    }

    if (isLight) {
        if (urlInput) urlInput.classList.remove('white-placeholder');
        if (titleBarText) titleBarText.style.opacity = '0.5';
        if (brandingDesc) {
            brandingDesc.classList.add('text-gray-500');
            brandingDesc.classList.remove('text-white');
            brandingDesc.style.opacity = '0.8';
        }
        if (historyBtn) {
            historyBtn.classList.add('text-white/40');
            historyBtn.classList.remove('text-white');
        }
        if (mainQueueStatus) {
            mainQueueStatus.classList.add('text-white/20');
            mainQueueStatus.classList.remove('text-white');
        }
    } else {
        // Mode Sombre / Gris
        if (urlInput) urlInput.classList.add('white-placeholder');
        if (titleBarText) titleBarText.style.opacity = '1';
        if (brandingDesc) {
            brandingDesc.classList.remove('text-gray-500');
            brandingDesc.classList.add('text-white');
            brandingDesc.style.opacity = '1';
        }
        if (historyBtn) {
            historyBtn.classList.remove('text-white/40');
            historyBtn.classList.add('text-white');
        }
        if (mainQueueStatus) {
            mainQueueStatus.classList.remove('text-white/20');
            mainQueueStatus.classList.add('text-white');
        }
    }
}

function showFAQ() {
    document.getElementById('faq-modal').classList.remove('hidden');
    royoutToggleMenu();
}

function closeFAQ() {
    document.getElementById('faq-modal').classList.add('hidden');
}

function showSupport() {
    document.getElementById('support-modal').classList.remove('hidden');
    royoutToggleMenu();
}

function closeSupport() {
    document.getElementById('support-modal').classList.add('hidden');
}

function showAbout() {
    document.getElementById('about-modal').classList.remove('hidden');
    royoutToggleMenu();
}

function closeAbout() {
    document.getElementById('about-modal').classList.add('hidden');
}

// Nettoyage de l'ancien listener de clic (doublon supprimé)

// Fonctions de la File d'attente
function showQueue() {
    const modal = document.getElementById('queue-modal');
    const content = document.getElementById('queue-list-content');
    modal.classList.remove('hidden');
    
    window.pywebview.api.get_queue().then(res => {
        const current = res.current;
        const queue = res.queue;
        
        if (!current && (!queue || queue.length === 0)) {
            content.innerHTML = '<div class="text-center py-20 text-white/20 text-xs font-bold uppercase tracking-widest">La file d\'attente est vide</div>';
            return;
        }
        
        let html = '';
        
        // 1. Tâche en cours
        if (current) {
            const isAudio = current.format_id.includes('mp3');
            html += `
            <div class="mb-8">
                <p class="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> En cours de téléchargement
                </p>
                <div class="p-6 rounded-[32px] bg-red-600/10 border border-red-500/20 shadow-xl shadow-red-900/10">
                    <div class="flex items-center gap-6 mb-6">
                        <div class="relative w-32 h-20 rounded-2xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/5">
                            <img src="${current.thumbnail}" class="w-full h-full object-cover" onerror="this.src='logo.png'">
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-black text-white truncate mb-2">${current.title}</p>
                            <div class="flex items-center gap-3">
                                <span class="px-2 py-0.5 rounded-md bg-red-600 text-white text-[8px] font-black uppercase tracking-widest">${current.resolution}</span>
                                <span id="queue-speed" class="text-[10px] font-bold text-gray-400">0 MB/s</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <span id="queue-percent" class="text-3xl font-black text-white leading-none">0%</span>
                        </div>
                    </div>
                    <!-- Barre de progression mini -->
                    <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div id="queue-progress-bar" class="h-full bg-red-600 w-0 transition-all duration-300"></div>
                    </div>
                </div>
            </div>
            `;
        }
        
        // 2. Liste d'attente
        if (queue && queue.length > 0) {
            html += `<p class="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-4">Prochains téléchargements (${queue.length})</p>`;
            html += queue.map((item, index) => {
                const isAudio = item.format_id.includes('mp3');
                return `
                <div class="flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5 opacity-60">
                    <div class="relative w-20 h-12 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
                        <img src="${item.thumbnail}" class="w-full h-full object-cover grayscale" onerror="this.src='logo.png'">
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] font-bold text-white/80 truncate mb-1">${item.title}</p>
                        <span class="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[7px] font-black uppercase tracking-widest border border-white/5">${item.resolution}</span>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/20">
                        #${index + 1}
                    </div>
                </div>
                `;
            }).join('');
        }
        
        content.innerHTML = html;
    });
}

function closeQueue() {
    document.getElementById('queue-modal').classList.add('hidden');
}

// ... rest of the file

// Fix pour les problèmes de dimensionnement
function fixHeight() {
    const root = document.querySelector('.h-screen');
    if (root) {
        root.style.height = window.innerHeight + 'px';
    }
}
window.addEventListener('resize', fixHeight);
window.addEventListener('load', () => {
    fixHeight();
    // Cache le splash screen après 2.5 secondes
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            // Optionnel : Retirer du DOM après l'animation pour libérer de la mémoire
            setTimeout(() => splash.remove(), 1000);
        }
    }, 2500);
});
function handleDrop(e) {
    e.preventDefault();
    const url = e.dataTransfer.getData('text');
    if (url) {
        document.getElementById('url').value = url;
        analyzeVideo();
    }
}

function showError(msg) {
    const errorDisplay = document.getElementById('error-display');
    const errorText = document.getElementById('error-message-text');
    const preview = document.getElementById('video-preview');
    const playlistPreview = document.getElementById('playlist-preview');

    // Cacher les autres vues
    preview.classList.add('hidden');
    playlistPreview.classList.add('hidden');

    errorText.innerText = msg;
    errorDisplay.classList.remove('hidden');

    // Réinitialiser le bouton d'analyse
    const btn = document.getElementById('analyze-btn');
    const loader = document.getElementById('analyze-loader');
    if (btn) {
        btn.innerHTML = '<span>Analyser</span><i class="fas fa-arrow-right text-[10px]"></i><i id="analyze-loader" class="fas fa-circle-notch fa-spin hidden"></i>';
        btn.disabled = false;
    }
}

function hideError() {
    document.getElementById('error-display').classList.add('hidden');
}

fixHeight();

function analyzeVideo() {
    userHasInteracted = true; // L'utilisateur a pris la main, stop discovery
    hideError();
    const url = document.getElementById('url').value.trim();
    const btn = document.getElementById('analyze-btn');
    const loader = document.getElementById('analyze-loader');
    const preview = document.getElementById('video-preview');
    const progressContainer = document.getElementById('progress-container');

    if (!url) {
        showError("Veuillez entrer un mot-clé ou un lien YouTube.");
        return;
    }

    if (btn.disabled || btn.innerText === "Analyse...") {
        console.log("Analyse déjà en cours, ignorant le clic supplémentaire.");
        return;
    }

    console.log("Analyse manuelle validée pour:", url);

    // Sécurité : Attendre que l'API soit chargée
    if (!window.pywebview || !window.pywebview.api) {
        btn.innerText = "Initialisation...";
        setTimeout(analyzeVideo, 500);
        return;
    }

    // Si ce n'est pas une URL, on lance une recherche
    const isUrl = url.includes('youtube.com/') || url.includes('youtu.be/') || url.includes('http');
    if (!isUrl) {
        window.searchVideos(url);
        return;
    }

    // Annuler tout timeout de recherche en cours si on valide manuellement
    if (searchTimeout) clearTimeout(searchTimeout);

    currentUrl = url;
    btn.innerText = "Analyse...";
    btn.disabled = true;
    loader.classList.remove('hidden');

    // Récupérer le dossier actuel pour l'affichage (avec sécurité)
    window.pywebview.api.get_current_folder().then(folder => {
        if (folder) {
            selectedFolder = folder;
            const folderName = folder.split(/[\\\/]/).pop() || folder;
            const folderDisplay = document.getElementById('current-folder-path');
            if (folderDisplay) folderDisplay.innerText = folderName;
            const playlistFolderDisplay = document.getElementById('playlist-folder-path');
            if (playlistFolderDisplay) playlistFolderDisplay.innerText = folderName;
        }
    }).catch(err => console.error("Erreur dossier:", err));

    console.log("Analyse lancée pour:", url);
    window.pywebview.api.get_video_info(url).then(response => {
        console.log("Réponse reçue:", response);
        btn.innerText = "Analyser";
        btn.disabled = false;
        loader.classList.add('hidden');

        // Reset views
        preview.classList.add('hidden');
        document.getElementById('playlist-preview').classList.add('hidden');

        if (response.status === 'success') {
            currentThumbnail = response.thumbnail || '';
            document.getElementById('thumb').src = currentThumbnail;
            document.getElementById('title').innerText = response.title || 'Vidéo';
            document.getElementById('duration').innerText = response.duration || '';
            
            // S'assurer que le lecteur est réinitialisé pour une nouvelle vidéo
            stopVideoPreview();

            // Effet Premium : Thème adaptatif (simulé par une teinte rouge/orangée si thumbnail présente)
            document.documentElement.style.setProperty('--accent-color', response.thumbnail ? '#ef4444' : '#ef4444');
            const favBtn = document.getElementById('fav-btn');
            const isFav = favorites.some(f => f.url === currentUrl);
            if (favBtn) favBtn.innerHTML = isFav ? '<i class="fas fa-heart text-red-500"></i>' : '<i class="fas fa-heart"></i>';

            // Bloquer le scroll du fond et afficher le modal
            document.body.style.overflow = 'hidden';
            const backdrop = document.getElementById('modal-backdrop');
            if (backdrop) backdrop.classList.remove('hidden');
            preview.classList.remove('hidden');

            // Gestion des langues
            const langContainer = document.getElementById('language-selector-container');
            const langSelect = document.getElementById('audio-lang-select');
            if (response.languages && response.languages.length > 1) {
                langContainer.classList.remove('hidden');
                langSelect.innerHTML = response.languages.map(l => `<option value="${l.id}">${l.label}</option>`).join('');
            } else {
                langContainer.classList.add('hidden');
            }

            const videoGrid = document.getElementById('video-formats');
            const audioGrid = document.getElementById('audio-formats');
            
            videoGrid.innerHTML = '';
            audioGrid.innerHTML = '';

            if (response.formats && response.formats.length > 0) {
                response.formats.forEach(f => {
                    const button = document.createElement('button');
                    const isAudio = f.type === 'audio';
                    
                    button.className = isAudio
                        ? "bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                        : "bg-red-600/5 hover:bg-red-600/15 border border-red-500/20 p-4 rounded-2xl font-bold transition-all active:scale-95 text-red-400 flex flex-col items-center justify-center gap-1";
                    
                    button.innerHTML = `
                        <span class="text-base">${f.label}</span>
                        ${f.desc ? `<span class="text-[10px] opacity-50 font-light uppercase tracking-wider">${f.desc}</span>` : ''}
                    `;
                    button.onclick = () => startDownload(f.id);
                    
                    if (isAudio) audioGrid.appendChild(button);
                    else videoGrid.appendChild(button);
                });
            }

            preview.classList.remove('hidden');
        } else if (response.status === 'playlist') {
            playlistData = response.entries;
            document.getElementById('playlist-title').innerText = response.title;
            document.getElementById('playlist-count').innerText = response.count;
            
            // Bloquer le scroll du fond et afficher le modal
            document.body.style.overflow = 'hidden';
            const backdrop = document.getElementById('modal-backdrop');
            if (backdrop) backdrop.classList.remove('hidden');
            document.getElementById('playlist-preview').classList.remove('hidden');

            // 1. Peupler les formats de téléchargement par lots
            const batchContainer = document.getElementById('playlist-batch-formats');
            const batchFormats = [
                { id: 'mp3_320', label: 'MP3 320k', type: 'audio' },
                { id: 'mp3_128', label: 'MP3 128k', type: 'audio' },
                { id: '1080', label: '1080p MP4', type: 'video' },
                { id: '720', label: '720p MP4', type: 'video' }
            ];
            
            batchContainer.innerHTML = batchFormats.map(f => `
                <button onclick="selectedBatchFormat='${f.id}'; this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('border-orange-500','bg-orange-500/10')); this.classList.add('border-orange-500','bg-orange-500/10')" 
                        class="w-full p-4 rounded-2xl border border-white/10 bg-white/5 text-left transition-all hover:bg-white/10">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-bold text-white">${f.label}</span>
                        <i class="fas ${f.type==='audio'?'fa-music':'fa-video'} text-[10px] opacity-30"></i>
                    </div>
                </button>
            `).join('');
            
            // Par défaut on sélectionne le premier
            selectedBatchFormat = 'mp3_320';
            if (batchContainer.firstElementChild) batchContainer.firstElementChild.classList.add('border-orange-500', 'bg-orange-500/10');

            // 2. Peupler la liste des vidéos
            const videoList = document.getElementById('playlist-videos');
            videoList.innerHTML = response.entries.map((v, i) => `
                <div class="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group/item">
                    <div class="relative w-16 h-10 rounded-lg overflow-hidden bg-black/20 flex-shrink-0 border border-white/5">
                        <img src="${v.thumbnail || 'logo.png'}" class="w-full h-full object-cover" onerror="this.src='logo.png'">
                        <div class="absolute bottom-0 right-0 px-1 bg-black/60 text-[8px] font-black text-white/60 rounded-tl-md border-t border-l border-white/5">${i+1}</div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] font-bold text-white/80 truncate mb-0.5">${v.title || 'Vidéo sans titre'}</p>
                    </div>
                    <button onclick="analyzeDirect('${v.url}')" class="p-2 text-white/20 hover:text-red-500 transition-colors">
                        <i class="fas fa-play text-[10px]"></i>
                    </button>
                </div>
            `).join('');
        } else {
            showError(response.message || "Impossible d'analyser ce lien. Vérifiez votre connexion ou l'URL.");
        }
    });
}

function downloadPlaylist(formatId) {
    if (!playlistData || playlistData.length === 0) return;
    
    const progressContainer = document.getElementById('progress-container');
    const statusMessage = document.getElementById('status-message');
    
    // Affichage de l'overlay
    progressContainer.classList.remove('hidden');
    setTimeout(() => {
        progressContainer.classList.add('active', 'opacity-100');
        progressContainer.classList.remove('opacity-0', 'pointer-events-none');
    }, 10);

    statusMessage.innerText = "Ajout de la playlist à la file...";
    
    window.pywebview.api.download_playlist(playlistData, formatId, selectedFolder).then(res => {
        if (res.status === 'success') {
            window.showToast(res.message);
            // On peut quitter l'aperçu de playlist après avoir lancé
            goBack();
        }
    });
}

function downloadPlaylistBatch() {
    console.log("Lancement téléchargement par lots avec format:", selectedBatchFormat);
    downloadPlaylist(selectedBatchFormat);
}

function changeFolder() {
    window.pywebview.api.select_folder().then(folder => {
        if (folder) {
            selectedFolder = folder;
            const folderName = folder.split(/[\\\/]/).pop() || folder;
            const folderDisplay = document.getElementById('current-folder-path');
            if (folderDisplay) folderDisplay.innerText = folderName;
            const playlistFolderDisplay = document.getElementById('playlist-folder-path');
            if (playlistFolderDisplay) playlistFolderDisplay.innerText = folderName;
        }
    });
}

function startDownload(formatId) {
    console.log("Tentative de téléchargement pour le format:", formatId);
    
    if (isScheduling) {
        pendingFormatId = formatId;
        document.getElementById('schedule-modal').classList.remove('hidden');
        return;
    }
    
    if (!window.pywebview || !window.pywebview.api) {
        alert("Erreur: L'API Python n'est pas chargée.");
        return;
    }

    const progressContainer = document.getElementById('progress-container');
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    const percentText = document.getElementById('percent-text');
    const videoTitle = document.getElementById('video-title');

    // On affiche l'overlay
    progressContainer.classList.remove('hidden');
    setTimeout(() => {
        progressContainer.classList.add('active');
        progressContainer.classList.remove('opacity-0', 'pointer-events-none');
    }, 10);
    
    // Scroll automatique vers la progression
    progressContainer.scrollIntoView({ behavior: 'smooth' });

    progressBar.style.width = '0%';
    percentText.innerText = '0%';
    videoTitle.innerText = document.getElementById('title').innerText || 'Démarrage...';
    const progressThumb = document.getElementById('progress-thumb');
    if (progressThumb && currentThumbnail) progressThumb.src = currentThumbnail;
    statusMessage.innerText = 'Connexion à YouTube...';

    const selectedLang = document.getElementById('audio-lang-select').value;
    const trimStart = document.getElementById('trim-start').value.trim();
    const trimEnd = document.getElementById('trim-end').value.trim();
    const downloadSubs = document.getElementById('download-subs').checked;

    const options = {
        trim_start: trimStart || null,
        trim_end: trimEnd || null,
        subtitles: downloadSubs
    };

    window.pywebview.api.download_video(currentUrl, formatId, selectedFolder, selectedLang, options).then(response => {
        console.log("Réponse API:", response);
        statusMessage.innerText = response.message;
        
        // Si c'est un ajout à la file, on peut le notifier
        if (response.message.includes('file')) {
            statusMessage.classList.add('text-orange-500');
        }
    }).catch(err => {
        console.error("Erreur API:", err);
        alert("Erreur lors de l'appel au téléchargement: " + err);
    });
}

window.resetProgress = function(formatId, title, thumbnail) {
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    const successActions = document.getElementById('success-actions');
    const percentText = document.getElementById('percent-text');
    const speedVal = document.getElementById('speed-val');
    const etaVal = document.getElementById('eta-val');
    const progressThumb = document.getElementById('progress-thumb');
    const videoTitle = document.getElementById('video-title');
    
    if (progressThumb && thumbnail) progressThumb.src = thumbnail;
    if (videoTitle && title) videoTitle.innerText = title;
    
    statusMessage.innerText = 'Démarrage du prochain téléchargement...';
    statusMessage.className = 'text-center text-[10px] mt-6 uppercase tracking-[0.5em] font-black text-red-500 animate-pulse';
    progressBar.style.width = '0%';
    percentText.innerText = '0%';
    speedVal.innerText = '0 MB/s';
    etaVal.innerText = '--:--';
    successActions.classList.add('hidden');
};

window.updateProgress = function(percent, speed, eta, title) {
    console.log("UPDATE REÇU :", percent, speed);
    const progressBar = document.getElementById('progress-bar');
    const percentText = document.getElementById('percent-text');
    const videoTitle = document.getElementById('video-title');
    const speedVal = document.getElementById('speed-val');
    const etaVal = document.getElementById('eta-val');
    
    const numPercent = parseFloat(percent);
    
    if (!isNaN(numPercent)) {
        progressBar.style.width = numPercent + '%';
        percentText.innerText = Math.round(numPercent) + '%';
        
        // Mise à jour de la file d'attente (si le modal est ouvert)
        const qBar = document.getElementById('queue-progress-bar');
        const qPercent = document.getElementById('queue-percent');
        const qSpeed = document.getElementById('queue-speed');
        
        if (qBar) qBar.style.width = numPercent + '%';
        if (qPercent) qPercent.innerText = Math.round(numPercent) + '%';
        if (qSpeed && speed) qSpeed.innerText = speed;
    }

    if (speed && speed !== '0 MB/s') {
        speedVal.innerText = speed;
        etaVal.innerText = eta;
    }
    
    if (title && title !== '') {
        videoTitle.innerText = title;
    }
};

window.updateQueueUI = function(count) {
    const queueStatus = document.getElementById('queue-status');
    const queueCount = document.getElementById('queue-count');
    const mainQueueStatus = document.getElementById('main-queue-status');
    const mainQueueCount = document.getElementById('main-queue-count');
    const mainIconBg = document.getElementById('main-queue-icon-bg');
    const queuePulse = document.getElementById('queue-pulse');
    
    if (count > 0) {
        // État Actif (Rouge + Pulse)
        if (queueStatus) {
            queueStatus.classList.remove('hidden');
            queueCount.innerText = count;
        }
        if (mainQueueStatus) {
            mainQueueStatus.classList.add('text-red-500');
            mainQueueStatus.classList.remove('text-white/20');
            mainQueueCount.innerText = count;
            if (queuePulse) queuePulse.classList.remove('hidden');
            if (mainIconBg) {
                mainIconBg.classList.add('bg-red-600/20', 'border-red-500/30', 'shadow-[0_0_10px_rgba(220,38,38,0.2)]');
                mainIconBg.classList.remove('bg-white/5', 'border-white/5');
            }
        }
    } else {
        // État Vide (Gris discret)
        if (queueStatus) queueStatus.classList.add('hidden');
        if (mainQueueStatus) {
            mainQueueStatus.classList.remove('text-red-500');
            mainQueueStatus.classList.add('text-white/20');
            mainQueueCount.innerText = '0';
            if (queuePulse) queuePulse.classList.add('hidden');
            if (mainIconBg) {
                mainIconBg.classList.remove('bg-red-600/20', 'border-red-500/30', 'shadow-[0_0_10px_rgba(220,38,38,0.2)]');
                mainIconBg.classList.add('bg-white/5', 'border-white/5');
            }
        }
    }
};

function shareApp() {
    const shareData = {
        title: 'RoYout - Premium Downloader',
        text: 'Découvre RoYout, le meilleur téléchargeur YouTube ultra-rapide !',
        url: 'https://github.com/seritagroroy-oss/ROYOUT-V2'
    };

    if (navigator.share) {
        navigator.share(shareData).catch(err => console.log('Erreur partage:', err));
    } else {
        // Fallback: Copier dans le presse-papiers
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = shareData.url;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        window.showToast("Lien de partage copié dans le presse-papiers !");
    }
}

window.onDownloadComplete = function(status, message) {
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    const successActions = document.getElementById('success-actions');
    
    statusMessage.innerText = message;
    statusMessage.classList.remove('animate-pulse');
    
    if (status === 'success') {
        statusMessage.className = 'text-center text-[10px] mt-20 uppercase tracking-[0.5em] font-black text-green-500';
        progressBar.style.width = '100%';
        successActions.classList.remove('hidden');
    } else {
        statusMessage.className = 'text-center text-[10px] mt-20 uppercase tracking-[0.5em] font-black text-red-500';
        successActions.classList.remove('hidden');
    }
};

function closeOverlay() {
    const progressContainer = document.getElementById('progress-container');
    const successActions = document.getElementById('success-actions');
    const progressBar = document.getElementById('progress-bar');
    const percentText = document.getElementById('percent-text');
    const statusMessage = document.getElementById('status-message');
    
    // Fermer l'overlay (animation)
    progressContainer.classList.remove('active');
    
    // Réinitialiser et cacher COMPLÈTEMENT après la transition
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        successActions.classList.add('hidden');
        progressBar.style.width = '0%';
        percentText.innerText = '0%';
        statusMessage.innerText = '';
        statusMessage.classList.remove('text-green-500', 'text-red-500');
    }, 500);
}

function resetApp() {
    const urlInput = document.getElementById('url');
    const preview = document.getElementById('video-preview');
    const playlistPreview = document.getElementById('playlist-preview');
    const backdrop = document.getElementById('modal-backdrop');
    
    // Tout effacer
    urlInput.value = '';
    currentUrl = '';
    if (preview) preview.classList.add('hidden');
    if (playlistPreview) playlistPreview.classList.add('hidden');
    if (backdrop) backdrop.classList.add('hidden');
    
    // Libérer le scroll
    document.body.style.overflow = 'auto';
    
    stopVideoPreview();
}

function openFolder() {
    window.pywebview.api.open_download_folder(selectedFolder);
}

function toggleHistory() {
    const modal = document.getElementById('history-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        loadHistory();
    } else {
        modal.classList.add('hidden');
    }
}

async function loadHistory() {
    const historyList = document.getElementById('history-list');
    const history = await window.pywebview.api.get_history();
    
    if (!history || history.length === 0) {
        historyList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full opacity-20">
                <i class="fas fa-history text-8xl mb-6"></i>
                <p class="text-xl font-bold uppercase tracking-widest">Aucun historique</p>
            </div>`;
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="group relative bg-white/[0.02] border border-white/5 p-6 rounded-[30px] flex items-center gap-8 hover:bg-white/[0.04] transition-all hover:border-white/10">
            <img src="${item.thumbnail}" class="w-40 aspect-video rounded-2xl object-cover shadow-xl border border-white/5">
            <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-white truncate mb-1">${item.title}</h3>
                <div class="flex items-center gap-4 text-[10px] uppercase tracking-widest font-black">
                    <span class="text-red-500">${item.resolution}</span>
                    <span class="text-gray-600">•</span>
                    <span class="text-gray-400">${item.date}</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="window.pywebview.api.open_download_folder('${item.folder.replace(/\\/g, '/')}')" class="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg" title="Ouvrir le dossier">
                    <i class="fas fa-folder-open"></i>
                </button>
                <button onclick="deleteHistoryItem('${item.id}')" class="w-12 h-12 rounded-2xl bg-red-600/10 hover:bg-red-600/20 flex items-center justify-center text-red-500 transition-all shadow-lg" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// --- GESTION DES FAVORIS ---
function toggleFavorites() {
    const modal = document.getElementById('favorites-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        renderFavorites();
    } else {
        modal.classList.add('hidden');
    }
}

function toggleFavorite() {
    const video = {
        url: currentUrl,
        title: document.getElementById('title').innerText,
        thumbnail: currentThumbnail,
        duration: document.getElementById('duration').innerText
    };

    window.pywebview.api.toggle_favorite(video).then(res => {
        if (res.status === 'success') {
            favorites = res.favorites;
            const btn = document.getElementById('fav-btn');
            if (res.action === 'added') {
                if (btn) btn.innerHTML = '<i class="fas fa-heart text-red-500"></i>';
                window.showToast("Ajouté aux favoris !");
            } else {
                if (btn) btn.innerHTML = '<i class="fas fa-heart"></i>';
                window.showToast("Retiré des favoris.");
            }
        }
    });
}

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    if (favorites.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full opacity-20">
                <i class="fas fa-heart text-8xl mb-6"></i>
                <p class="text-xl font-bold uppercase tracking-widest">Aucun favori</p>
            </div>`;
        return;
    }

    list.innerHTML = favorites.map(f => `
        <div class="group relative bg-white/[0.02] border border-white/5 p-6 rounded-[30px] flex items-center gap-8 hover:bg-white/[0.04] transition-all hover:border-white/10">
            <div class="relative w-40 aspect-video rounded-2xl overflow-hidden shadow-xl border border-white/5">
                <img src="${f.thumbnail}" class="w-full h-full object-cover">
                <div class="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] font-black">${f.duration}</div>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-white truncate mb-1">${f.title}</h3>
                <p class="text-[9px] text-gray-500 font-black uppercase tracking-widest">YouTube</p>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="analyzeDirect('${f.url}')" class="w-12 h-12 rounded-2xl bg-red-600/10 hover:bg-red-600/20 flex items-center justify-center text-red-500 transition-all shadow-lg" title="Analyser">
                    <i class="fas fa-play"></i>
                </button>
                <button onclick="removeFavorite('${f.url}')" class="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function removeFavorite(url) {
    const video = { url: url };
    window.pywebview.api.toggle_favorite(video).then(res => {
        if (res.status === 'success') {
            favorites = res.favorites;
            renderFavorites();
            window.showToast("Favori supprimé.");
        }
    });
}

async function deleteHistoryItem(id) {
    const success = await window.pywebview.api.delete_history_item(id);
    if (success) loadHistory();
}

window.showToast = function(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'bg-white/10 backdrop-blur-3xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 text-white animate-fade-in pointer-events-auto transform transition-all duration-500 translate-x-20 opacity-0';
    toast.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-[10px]">
            <i class="fas fa-check"></i>
        </div>
        <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-red-500">Succès</span>
            <span class="text-xs font-bold text-gray-200">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => {
        toast.classList.remove('translate-x-20', 'opacity-0');
    }, 10);

    // Suppression automatique
    setTimeout(() => {
        toast.classList.add('translate-x-20', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

window.onClipboardLink = function(url) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'bg-red-600/90 backdrop-blur-3xl border border-red-500/30 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 text-white animate-fade-in pointer-events-auto cursor-pointer transform transition-all duration-500 hover:scale-105';
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
            <i class="fas fa-paste"></i>
        </div>
        <div class="flex flex-col flex-1">
            <span class="text-[10px] font-black uppercase tracking-widest text-white/70">Lien détecté</span>
            <span class="text-xs font-bold text-white truncate max-w-[200px]">Cliquer pour analyser</span>
        </div>
    `;
    
    toast.onclick = () => {
        document.getElementById('url').value = url;
        analyzeVideo();
        toast.remove();
    };
    
    container.appendChild(toast);
    
    // Auto-suppression après 8 secondes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('translate-x-20', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
        }
    }, 8000);
};

let isScheduling = false;
let pendingFormatId = null;

function openScheduler() {
    isScheduling = true;
    window.showToast("Mode Planification Activé. Choisissez un format.");
    const btn = document.getElementById('schedule-btn-trigger');
    btn.classList.add('bg-indigo-600', 'text-white');
    btn.classList.remove('bg-indigo-600/10', 'text-indigo-500');
}

function closeScheduler() {
    isScheduling = false;
    document.getElementById('schedule-modal').classList.add('hidden');
    const btn = document.getElementById('schedule-btn-trigger');
    btn.classList.remove('bg-indigo-600', 'text-white');
    btn.classList.add('bg-indigo-600/10', 'text-indigo-500');
}

function confirmSchedule(seconds) {
    if (!pendingFormatId) return;
    
    const selectedLang = document.getElementById('audio-lang-select').value;
    
    window.pywebview.api.schedule_download(currentUrl, pendingFormatId, selectedFolder, seconds, selectedLang).then(res => {
        if (res.status === 'success') {
            window.showToast(res.message);
            closeScheduler();
            resetApp();
        } else {
            alert("Erreur: " + res.message);
        }
    });
}

window.updateStatus = function(message) {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) statusMessage.innerText = message;
};

// Gestion de la taille des écritures (Zoom)
let currentFontSize = 100; // Pourcentage
window.changeFontSize = function(delta) {
    currentFontSize += (delta * 5); // Étapes de 5%
    if (currentFontSize < 70) currentFontSize = 70; // Minimum 70%
    if (currentFontSize > 150) currentFontSize = 150; // Maximum 150%
    document.documentElement.style.fontSize = currentFontSize + '%';
    console.log("Nouvelle taille de police : " + currentFontSize + "%");
};

window.resetFontSize = function() {
    currentFontSize = 100;
    document.documentElement.style.fontSize = '100%';
    console.log("Taille de police réinitialisée à 100%");
};

// --- Discovery System ---

window.onSearchInput = function() {
    const query = document.getElementById('url').value.trim();
    
    // Si l'utilisateur vide la barre, on réaffiche la découverte (Musique)
    if (query.length === 0) {
        userHasInteracted = false;
        if (searchTimeout) clearTimeout(searchTimeout);
        window.searchVideos("Musique");
        return;
    }

    // Dès qu'on commence à taper, on prend la main
    if (query.length > 0) {
        userHasInteracted = true;
        
        const title = document.getElementById('discovery-title');
        if (title) title.innerText = `Recherche : ${query}...`;
        
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const latestQuery = document.getElementById('url').value.trim();
            if (latestQuery.length > 0) {
                console.log("Lancement recherche automatique (debounce) pour:", latestQuery);
                window.searchVideos(latestQuery);
            }
        }, 800);
    }
};

window.searchVideos = function(query, offset = 1, append = false, searchType = 'mixed') {
    try {
        const grid = document.getElementById('discovery-grid');
        const title = document.getElementById('discovery-title');
        const btn = document.getElementById('analyze-btn');
        
        // Système de déblocage automatique
        if (isLoadingMore && !append) {
            console.log("Forçage de la recherche...");
            isLoadingMore = false; 
        } else if (isLoadingMore) {
            return;
        }
        
        const queryToSearch = query || currentSearchQuery || "Musique";
        const currentRequestId = ++lastSearchId;
        
        // Mise à jour de l'état global
        currentSearchQuery = queryToSearch;
        if (!append) {
            currentOffset = 1;
        } else {
            currentOffset = offset;
        }
        
        if (query && query !== "Musique") userHasInteracted = true;

        if (!append) {
            if (title) {
                const icon = searchType === 'playlist' ? 'fa-list-ul text-orange-500' : 'fa-fire text-red-600';
                title.innerHTML = `<i class="fas ${icon} text-lg"></i><span>${searchType === 'playlist' ? 'Playlists' : 'Recherche'} : ${queryToSearch}</span>`;
            }
            if (grid) grid.innerHTML = '<div class="col-span-full flex flex-col items-center py-20 gap-4"><i class="fas fa-circle-notch fa-spin text-4xl text-red-600"></i><p class="text-white opacity-50 uppercase tracking-widest text-[10px]">Chargement des résultats...</p></div>';
            if (btn) btn.innerHTML = '<span>Analyse...</span><i class="fas fa-circle-notch fa-spin"></i>';
        } else {
            // Pour le "Charger plus", on montre un loader discret en bas
            const existingLoader = document.getElementById('load-more-spinner');
            if (existingLoader) existingLoader.classList.remove('hidden');
        }

        isLoadingMore = true;

        // SÉCURITÉ : Si la recherche met plus de 20s, on débloque le bouton
        setTimeout(() => {
            if (isLoadingMore && currentRequestId === lastSearchId) {
                isLoadingMore = false;
                if (btn) btn.innerHTML = '<span>Analyser</span><i class="fas fa-arrow-right text-[10px]"></i>';
            }
        }, 20000);

        const isApiReady = window.pywebview && window.pywebview.api && typeof window.pywebview.api.search_videos === 'function';

        if (isApiReady) {
            window.pywebview.api.search_videos(queryToSearch, offset, searchLimit, currentRequestId, searchType).then(response => {
                isLoadingMore = false;
                const loadMoreSpinner = document.getElementById('load-more-spinner');
                if (loadMoreSpinner) loadMoreSpinner.classList.add('hidden');

                if (btn) btn.innerHTML = '<span>Analyser</span><i class="fas fa-arrow-right text-[10px]"></i>';
                if (currentRequestId !== lastSearchId) return;

                if (response && response.status === 'success') {
                    renderDiscoveryCards(response.results, append);
                } else {
                    const msg = response ? response.message : "Réponse vide";
                    if (!append && grid) grid.innerHTML = `<div class="col-span-full text-center text-red-500 py-10">Erreur : ${msg}</div>`;
                }
            }).catch(err => {
                isLoadingMore = false;
                const loadMoreSpinner = document.getElementById('load-more-spinner');
                if (loadMoreSpinner) loadMoreSpinner.classList.add('hidden');
                
                if (btn) btn.innerHTML = '<span>Analyser</span><i class="fas fa-arrow-right text-[10px]"></i>';
                if (!append && grid) grid.innerHTML = `<div class="col-span-full text-center text-red-500 py-10">Erreur API : ${err}</div>`;
            });
        } else {
            setTimeout(() => {
                isLoadingMore = false;
                window.searchVideos(query, offset, append, searchType);
            }, 1000);
        }
    } catch (globalErr) {
        console.error("Erreur critique dans searchVideos:", globalErr);
        isLoadingMore = false;
    }
};

function renderDiscoveryCards(results, append = false) {
    const grid = document.getElementById('discovery-grid');
    if (!grid) return;

    if (!append && (!results || results.length === 0)) {
        grid.innerHTML = `<div class="col-span-full text-center text-white/20 py-10">Aucun résultat trouvé</div>`;
        return;
    }

    const html = results.map(video => {
        const isPlaylist = video.type === 'playlist';
        const badgeText = isPlaylist ? 'PLAYLIST' : 'HD';
        const badgeClass = isPlaylist ? 'bg-orange-600/90' : 'bg-red-600/90';
        const iconClass = isPlaylist ? 'fas fa-list-ul' : 'fas fa-play';
        
        return `
        <div onclick="analyzeDirect('${video.url}')" 
             onmouseenter="startHoverPreview(this, '${video.url}', '${video.uploader || 'YouTube'}')" 
             onmouseleave="stopHoverPreview(this)"
             class="group video-card-glow relative cursor-pointer flex flex-col gap-3 p-3 rounded-[28px] bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-red-500/30 transition-all duration-500">
            
            <div class="preview-tooltip">
                <span class="tooltip-tag">Propulsé par RoYout</span>
                <span>${video.uploader || 'YouTube'} • ${video.duration}</span>
            </div>

            <div class="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
                <img src="${video.thumbnail}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onerror="this.src='logo.png'">
                
                <!-- Preview Container -->
                <div class="preview-video-container">
                    <div class="preview-loader">
                        <i class="fas fa-circle-notch fa-spin text-white/50"></i>
                    </div>
                    <div class="preview-progress-bar"></div>
                </div>

                <div class="absolute top-2 left-2 px-2 py-1 ${badgeClass} ${isPlaylist ? 'playlist-badge-pulse' : ''} backdrop-blur-md rounded-md text-[8px] font-black text-white border border-white/20 shadow-lg uppercase">
                    ${badgeText}
                </div>
                <div class="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded-md text-[10px] font-black text-white border border-white/10">
                    ${video.duration}
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="w-12 h-12 rounded-full ${isPlaylist ? 'bg-orange-600' : 'bg-red-600'} flex items-center justify-center text-white shadow-xl transform scale-50 group-hover:scale-100 transition-transform">
                        <i class="${iconClass} ${!isPlaylist ? 'ml-1' : ''}"></i>
                    </div>
                </div>
            </div>
            <div class="px-2">
                <h3 class="text-[13px] font-bold text-white line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">${video.title}</h3>
                <p class="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">${video.uploader || 'YouTube'}</p>
            </div>
        </div>
        `;
    }).join('');

    if (append) {
        grid.innerHTML += html;
    } else {
        grid.innerHTML = html;
    }

    // Ajouter ou déplacer le loader de bas de page
    let loader = document.getElementById('load-more-spinner');
    if (loader) loader.remove();
    
    loader = document.createElement('div');
    loader.id = 'load-more-spinner';
    loader.className = 'col-span-full py-10 flex flex-col items-center gap-4 hidden';
    loader.innerHTML = `
        <i class="fas fa-circle-notch fa-spin text-2xl text-red-600"></i>
        <p class="text-[9px] font-black uppercase tracking-widest text-white/20">Recherche de la suite...</p>
    `;
    grid.appendChild(loader);

    // Ajouter le bouton de secours (Charger plus)
    const fallback = document.createElement('div');
    fallback.className = 'col-span-full py-10 flex justify-center';
    fallback.innerHTML = `
        <button onclick="window.searchVideos(currentSearchQuery, currentOffset + searchLimit, true)" class="px-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
            Charger plus de vidéos
        </button>
    `;
    grid.appendChild(fallback);
}

window.analyzeDirect = function(url) {
    stopHoverPreview(); // Arrêter l'aperçu si on clique
    document.getElementById('url').value = url;
    analyzeVideo();
    // On ne scrolle plus, le modal va apparaître par dessus
};

// --- Hover Preview Logic ---

window.startHoverPreview = function(element, url, uploader) {
    if (url.includes('playlist')) return; // Pas d'aperçu pour les playlists pour l'instant
    
    currentHoverUrl = url;
    const container = element.querySelector('.preview-video-container');
    const loader = element.querySelector('.preview-loader');
    const progressBar = element.querySelector('.preview-progress-bar');
    
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    hoverTimeout = setTimeout(() => {
        if (currentHoverUrl !== url) return;
        
        console.log("Démarrage de l'aperçu pour:", url);
        if (loader) loader.classList.add('active');
        if (container) container.classList.add('active');
        
        window.pywebview.api.get_stream_url(url).then(response => {
            if (response.status === 'success' && currentHoverUrl === url) {
                if (loader) loader.classList.remove('active');
                
                // Création du lecteur vidéo minimaliste
                const video = document.createElement('video');
                video.src = response.url;
                video.className = 'preview-video-element';
                video.muted = true;
                video.autoplay = true;
                video.loop = true;
                video.playsInline = true;
                
                // Gestion de la progression
                video.ontimeupdate = () => {
                    const percent = (video.currentTime / video.duration) * 100;
                    if (progressBar) progressBar.style.width = percent + '%';
                };
                
                // Nettoyage de l'ancien lecteur si présent
                if (activeHoverPlayer) {
                    activeHoverPlayer.pause();
                    activeHoverPlayer.remove();
                }
                
                container.appendChild(video);
                activeHoverPlayer = video;
                
                video.play().catch(e => console.error("Erreur lecture aperçu:", e));
            } else {
                if (container) container.classList.remove('active');
                if (loader) loader.classList.remove('active');
            }
        }).catch(err => {
            console.error("Erreur flux aperçu:", err);
            if (container) container.classList.remove('active');
            if (loader) loader.classList.remove('active');
        });
    }, 1200); // Délai de 1.2s pour éviter les déclenchements accidentels
};

window.stopHoverPreview = function(element) {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    currentHoverUrl = null;
    
    if (element) {
        const container = element.querySelector('.preview-video-container');
        const loader = element.querySelector('.preview-loader');
        const progressBar = element.querySelector('.preview-progress-bar');
        
        if (container) {
            container.classList.remove('active');
            // Retirer la vidéo après l'animation de fondu
            setTimeout(() => {
                const video = container.querySelector('video');
                if (video) video.remove();
                if (progressBar) progressBar.style.width = '0%';
            }, 500);
        }
        if (loader) loader.classList.remove('active');
    }

    if (activeHoverPlayer) {
        activeHoverPlayer.pause();
        activeHoverPlayer = null;
    }
};

window.goBack = function() {
    const backdrop = document.getElementById('modal-backdrop');
    const preview = document.getElementById('video-preview');
    const playlistPreview = document.getElementById('playlist-preview');
    
    if (backdrop) backdrop.classList.add('hidden');
    if (preview) preview.classList.add('hidden');
    if (playlistPreview) playlistPreview.classList.add('hidden');
    
    // Libérer le scroll
    document.body.style.overflow = 'auto';
    
    stopVideoPreview();
};

window.playVideoPreview = function() {
    const wrapper = document.getElementById('player-wrapper');
    const playOverlay = document.getElementById('play-overlay');
    
    if (wrapper) {
        // Afficher un petit loader pendant la récupération
        if (playOverlay) {
            playOverlay.innerHTML = '<i class="fas fa-circle-notch fa-spin text-4xl text-white"></i>';
        }

        window.pywebview.api.get_stream_url(currentUrl).then(response => {
            if (response.status === 'success') {
                wrapper.innerHTML = `
                    <video id="native-player" class="w-full h-full rounded-[25px] bg-black" controls autoplay>
                        <source src="${response.url}" type="video/mp4">
                        Votre navigateur ne supporte pas la lecture vidéo.
                    </video>`;
                
                // Afficher le bouton PiP
                const pipBtn = document.getElementById('pip-btn');
                if (pipBtn) pipBtn.classList.remove('hidden');

                // Désactiver le click pour ne pas recharger pendant la lecture
                const container = document.getElementById('thumb-container');
                if (container) container.onclick = null;
            } else {
                alert("Erreur de lecture : " + response.message);
                stopVideoPreview();
            }
        }).catch(err => {
            console.error("Erreur flux:", err);
            stopVideoPreview();
        });
    }
};

window.togglePiP = function(event) {
    if (event) event.stopPropagation();
    const video = document.getElementById('native-player');
    if (!video) return;

    try {
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else {
            video.requestPictureInPicture();
        }
    } catch (error) {
        console.error("PiP Error:", error);
        window.showToast("Le mode PiP n'est pas supporté par ce système.");
    }
};

window.stopVideoPreview = function() {
    const wrapper = document.getElementById('player-wrapper');
    const container = document.getElementById('thumb-container');
    if (wrapper && currentThumbnail) {
        wrapper.innerHTML = `
            <img id="thumb" src="${currentThumbnail}" class="w-full h-full object-cover">
            <div id="play-overlay" class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                <div class="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl transform transition-all group-hover:scale-110">
                    <i class="fas fa-play ml-1 text-xl"></i>
                </div>
            </div>
        `;
        if (container) container.onclick = window.playVideoPreview;
    }
};

function extractVideoId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length == 11) ? match[2] : null;
}

// Initialisation au chargement
window.addEventListener('load', () => {
    const mainArea = document.getElementById('main-content');
    if (mainArea) {
        mainArea.addEventListener('scroll', () => {
            const discovery = document.getElementById('discovery-section');
            const isVisible = discovery && !discovery.classList.contains('hidden');
            if (isVisible && !isLoadingMore) {
                const scrollPos = mainArea.scrollTop + mainArea.clientHeight;
                const scrollMax = mainArea.scrollHeight;
                if (scrollPos > scrollMax - 1000) {
                    window.searchVideos(currentSearchQuery, currentOffset + searchLimit, true);
                }
            }
        });
    }
});

// Lancement automatique dès que le pont Python est prêt
window.addEventListener('pywebviewready', () => {
    console.log("Pont Python prêt, chargement des données...");
    
    // Charger les favoris depuis le backend
    window.pywebview.api.get_favorites().then(favs => {
        favorites = favs || [];
        console.log("Favoris chargés:", favorites.length);
    });

    // Focus automatique sur la barre de recherche au démarrage
    const searchInput = document.getElementById('url');
    if (searchInput) searchInput.focus();

    setTimeout(() => {
        // PROTECTION : On ne lance la découverte que si l'utilisateur n'a rien tapé
        const searchInput = document.getElementById('url');
        const currentVal = searchInput ? searchInput.value.trim() : '';
        
        if (!currentVal && !userHasInteracted && window.searchVideos) {
            console.log("Lancement de la découverte par défaut...");
            window.searchVideos("Musique");
        } else {
            console.log("Découverte ignorée car l'utilisateur a déjà saisi du texte ou interagi.");
        }
    }, 1000); // Délai augmenté pour laisser le temps au moteur Python de se stabiliser
});

// Gestion des raccourcis clavier globaux
window.addEventListener('keydown', (e) => {
    // 1. Raccourci CTRL + F pour chercher
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('url');
        if (searchInput) {
            window.goBack(); // Retourner à l'accueil si on était ailleurs
            searchInput.focus();
            searchInput.select();
        }
    }

    // 2. Touche ECHAP pour fermer les fenêtres
    if (e.key === 'Escape') {
        const modalBackdrop = document.getElementById('modal-backdrop');
        if (modalBackdrop && !modalBackdrop.classList.contains('hidden')) {
            window.goBack();
        }
        // Fermer les autres modales TailWind
        const modals = ['about-modal', 'faq-modal', 'support-modal', 'queue-modal', 'history-modal', 'schedule-modal', 'confirm-modal'];
        modals.forEach(id => {
            const m = document.getElementById(id);
            if (m) m.classList.add('hidden');
        });
    }

    // Ne pas scroller si l'utilisateur est en train de taper du texte
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }

    const modalBackdrop = document.getElementById('modal-backdrop');
    const mainContent = document.getElementById('main-content');
    
    // Déterminer quelle zone faire défiler
    let target = null;
    if (modalBackdrop && !modalBackdrop.classList.contains('hidden')) {
        target = modalBackdrop;
    } else {
        target = mainContent;
    }

    if (target) {
        const scrollAmount = 60; // Un peu plus petit mais répété plus vite par le clavier
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            target.scrollBy(0, scrollAmount); // 'auto' par défaut, donc instantané
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            target.scrollBy(0, -scrollAmount);
        }
    }
});

// Fonctions de mise à jour
window.showUpdateModal = function(version) {
    const modal = document.getElementById('update-modal');
    const versionSpan = document.getElementById('update-version');
    if (modal && versionSpan) {
        versionSpan.innerText = version;
        modal.classList.remove('hidden');
    }
}

window.downloadUpdate = function() {
    // Redirige vers le site officiel
    window.pywebview.api.open_external_link("https://royout.vercel.app/");
    const modal = document.getElementById('update-modal');
    if (modal) modal.classList.add('hidden');
}

window.ignoreUpdate = function() {
    // Informe le backend qu'on ignore pour 7 jours
    window.pywebview.api.mark_update_as_ignored();
    const modal = document.getElementById('update-modal');
    if (modal) modal.classList.add('hidden');
}
