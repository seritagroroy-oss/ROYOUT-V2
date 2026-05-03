let currentUrl = '';
let selectedFolder = '';

// Fix pour les problèmes de dimensionnement sur Windows
function fixHeight() {
    const root = document.querySelector('.h-screen') || document.body;
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
fixHeight();

function analyzeVideo() {
    const url = document.getElementById('url').value.trim();
    const btn = document.getElementById('analyze-btn');
    const loader = document.getElementById('analyze-loader');
    const preview = document.getElementById('video-preview');
    const progressContainer = document.getElementById('progress-container');

    if (!url) {
        alert("Veuillez entrer une URL valide !");
        return;
    }

    currentUrl = url;
    btn.innerText = "Analyse...";
    btn.disabled = true;
    loader.classList.remove('hidden');

    // Récupérer le dossier actuel pour l'affichage (avec sécurité)
    window.pywebview.api.get_current_folder().then(folder => {
        if (folder) {
            selectedFolder = folder;
            const folderName = folder.split('/').pop() || folder;
            const folderDisplay = document.getElementById('current-folder-path');
            if (folderDisplay) folderDisplay.innerText = folderName;
        }
    }).catch(err => console.error("Erreur dossier:", err));

    console.log("Analyse lancée pour:", url);
    window.pywebview.api.get_video_info(url).then(response => {
        console.log("Réponse reçue:", response);
        btn.innerText = "Analyser";
        btn.disabled = false;
        loader.classList.add('hidden');

        if (response.status === 'success') {
            document.getElementById('thumb').src = response.thumbnail || '';
            document.getElementById('title').innerText = response.title || 'Vidéo';
            document.getElementById('duration').innerText = response.duration || '';
            
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
        } else {
            alert("Erreur : " + response.message);
        }
    });
}

function changeFolder() {
    window.pywebview.api.select_folder().then(folder => {
        if (folder) {
            selectedFolder = folder;
            document.getElementById('current-folder-path').innerText = folder.split('\\').pop() || folder;
        }
    });
}

function startDownload(formatId) {
    console.log("Tentative de téléchargement pour le format:", formatId);
    
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
    videoTitle.innerText = 'Démarrage...';
    statusMessage.innerText = 'Connexion à YouTube...';

    window.pywebview.api.download_video(currentUrl, formatId, selectedFolder).then(response => {
        console.log("Réponse API:", response);
        statusMessage.innerText = response.message;
    }).catch(err => {
        console.error("Erreur API:", err);
        alert("Erreur lors de l'appel au téléchargement: " + err);
    });
}

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
    }

    if (speed && speed !== '0 MB/s') {
        speedVal.innerText = speed;
        etaVal.innerText = eta;
    }
    
    if (title && title !== '') {
        videoTitle.innerText = title;
    }
};

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
    
    // Tout effacer
    urlInput.value = '';
    currentUrl = '';
    preview.classList.add('hidden');
    
    // Remonter en haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

async function deleteHistoryItem(id) {
    const success = await window.pywebview.api.delete_history_item(id);
    if (success) loadHistory();
}

window.updateStatus = function(message) {
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) statusMessage.innerText = message;
};
