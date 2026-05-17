import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import SearchSection from './components/SearchSection'
import HistoryModal from './components/HistoryModal'
import FavoritesModal from './components/FavoritesModal'
import VideoPreviewModal from './components/VideoPreviewModal'
import QueueModal from './components/QueueModal'
import MenuModal from './components/MenuModal'
import UpdateModal from './components/UpdateModal'
import SplashScreen from './components/SplashScreen'
import { useAppState } from './context/AppContext'
import { useApi } from './hooks/useApi'
import { VideoSkeleton } from './components/Skeleton'
import VideoCard from './components/VideoCard'

// --- BRANCHEMENTS GLOBAUX ---
window.showToast = (msg) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] bg-red-600 text-white px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-red-600/20 border border-white/20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4';
    toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
};

function App() {
  const { isReady, callApi } = useApi();
  const { setIsLoading, isLoading, favorites, toggleFavorite } = useAppState();
  
  // États de recherche
  const [searchResults, setSearchResults] = useState([]);
  const [discoveryTitle, setDiscoveryTitle] = useState('Découvrir');
  const [currentQuery, setCurrentQuery] = useState('Musique');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [immersionMode, setImmersionMode] = useState(false);
  
  // États des modales
  const [modals, setModals] = useState({
    history: false,
    favorites: false,
    preview: false,
    queue: false,
    menu: false,
    update: false
  });
  
  const [updateVersion, setUpdateVersion] = useState('0.0.0');
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [miniPlayerVideo, setMiniPlayerVideo] = useState(null);

  const MiniPlayer = ({ video, onClose }) => {
    const { callApi } = useApi();
    const [streamUrl, setStreamUrl] = useState(null);

    useEffect(() => {
      const getUrl = async () => {
        const res = await callApi('get_stream_url', video.url);
        if (res && res.status === 'success') setStreamUrl(res.url);
      };
      getUrl();
    }, [video.url]);

    if (!streamUrl) return null;

    return (
      <div className="fixed bottom-10 right-10 w-96 aspect-video bg-black rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-[1000] group animate-in slide-in-from-right-10 duration-500">
        <video src={streamUrl} autoPlay controls className="w-full h-full object-cover" />
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>
    );
  };

  useEffect(() => {
    window.setImmersionMode = (active) => setImmersionMode(active);
    
    window.showUpdateModal = (version) => {
      setUpdateVersion(version);
      openExclusiveModal('update');
    };

    window.applyTheme = (themeId) => {
      const bgColors = {
          'black': '#000000', 'onyx': '#0a0a0a', 'dark': '#0f0f0f', 'charcoal': '#161616',
          'anthracite': '#1a1a1a', 'slate': '#262626', 'night': '#333333', 'metal': '#4d4d4d',
          'soft': '#f0f0f0', 'light': '#ffffff', 'abyss': '#050a14', 'midnight': '#0a0c1a',
          'space': '#0d0d12', 'volcano': '#1a0d0d', 'plum': '#1a0d1a', 'ocean': '#0d1a1a',
          'forest': '#0d1a0d', 'concrete': '#808080', 'frost': '#e6f0f5', 'pearl': '#f5f5f5',
          'vsdark': '#1e1e1e', 'onedark': '#282c34', 'dracula': '#282a36', 'monokai': '#272822',
          'github': '#0d1117', 'nord': '#2e3440', 'solarized': '#002b36'
      };
      const lightThemes = ['light', 'soft', 'frost', 'pearl', 'concrete', 'metal', 'soft'];
      const targetColor = bgColors[themeId] || '#0f0f0f';
      
      document.documentElement.style.setProperty('--theme-bg', targetColor);
      
      if (lightThemes.includes(themeId)) {
          document.documentElement.classList.add('light-mode');
      } else {
          document.documentElement.classList.remove('light-mode');
      }
    };

    window.updateAmbiantTheme = (imageUrl) => {
      if (!imageUrl) return;
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        document.documentElement.style.setProperty('--theme-accent', `rgb(${r},${g},${b})`);
        document.documentElement.style.setProperty('--theme-accent-glow', `rgba(${r},${g},${b}, 0.2)`);
      };
    };
    window.onClipboardLink = (url) => {
      window.showToast("Lien détecté dans le presse-papiers !");
    };

    if (isReady) {
      const init = async () => {
        const settings = await callApi('get_all_settings');
        if (settings && settings.theme) {
          window.applyTheme(settings.theme);
        }
        loadDiscovery("Musique", 1, false);
      }
      init();
    }
  }, [isReady]);

  const loadDiscovery = async (query, page = 1, append = false, filter = 'mixed') => {
    setIsLoading(true);
    try {
      const startOffset = (page - 1) * 20 + 1;
      const res = await callApi('search_videos', query, startOffset, 20, 0, filter);
      if (res && res.status === 'success') {
        if (append) {
          setSearchResults(prev => [...prev, ...res.results]);
        } else {
          setSearchResults(res.results);
          setCurrentPage(1);
        }
        // On considère qu'il y a plus si on a reçu au moins 20 résultats
        setHasMore(res.results.length >= 20);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadDiscovery(currentQuery, nextPage, true, 'mixed'); // Pour le load more on garde mixed ou on passe le current filter
  };

  const handleSearch = (query, filter = 'mixed') => {
    if (!query) return;
    setDiscoveryTitle(`Résultats pour : ${query}`);
    setCurrentQuery(query);
    loadDiscovery(query, 1, false, filter);
  };

  const handleAnalyze = (query) => {
    if (query.includes('youtube.com/') || query.includes('youtu.be/')) {
       setActiveVideoUrl(query);
       openExclusiveModal('preview');
    } else {
       handleSearch(query);
    }
  };

  // Nouvelle fonction pour n'ouvrir qu'UNE SEULE modale à la fois
  const openExclusiveModal = (name) => {
    setModals({
        history: name === 'history',
        favorites: name === 'favorites',
        preview: name === 'preview',
        queue: name === 'queue',
        menu: name === 'menu',
        update: name === 'update'
    });
  };

  const closeModals = () => {
    setModals({
        history: false, favorites: false, preview: false,
        queue: false, menu: false, update: false
    });
  };

  return (
    <div className="h-screen text-white flex flex-col font-['Outfit'] select-none overflow-hidden transition-all duration-700">
      <SplashScreen />

      <Navbar 
        onOpenHistory={() => openExclusiveModal('history')}
        onOpenFavorites={() => openExclusiveModal('favorites')}
        onOpenQueue={() => openExclusiveModal('queue')}
        onOpenMenu={() => openExclusiveModal('menu')}
        immersionMode={immersionMode}
      />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar px-8 scroll-smooth">
        <div className="max-w-7xl mx-auto pb-40">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 3.2 }}
          >
            <SearchSection onAnalyze={handleAnalyze} onSearch={handleSearch} />
          </motion.div>

          <section className="mt-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5 }}
              className="flex items-center justify-between mb-10"
            >
              <h2 className="text-xl font-black uppercase tracking-[0.3em] text-[var(--theme-text-dim)] flex items-center gap-4">
                <i className="fas fa-fire text-red-600 text-lg animate-pulse"></i>
                <span>{discoveryTitle}</span>
              </h2>
              <div className="flex gap-2">
                   {['Musique', 'Gaming', 'Funny', 'Films'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => handleAnalyze(cat)}
                        className="px-4 py-2 rounded-xl bg-[var(--theme-card)] hover:bg-red-600 hover:text-white text-[var(--theme-text-dim)] hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all border border-[var(--theme-border)] shadow-[var(--theme-shadow)]"
                      >
                          {cat}
                      </button>
                  ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode='popLayout'>
                {searchResults && searchResults.map((video, index) => {
                  if (!video) return null;
                  const isFavorite = favorites?.some(f => f.url === video.url) || false;
                  return (
                    <VideoCard 
                      key={video.url + index}
                      video={video}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                      onClick={() => handleAnalyze(video.url)}
                    />
                  );
                })}

                {isLoading && searchResults.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                  <VideoSkeleton key={i} />
                ))}
              </AnimatePresence>
            </div>

            {/* BOUTON PLUS DE VIDÉOS */}
            {hasMore && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-20 flex justify-center pb-20"
              >
                  <button 
                    onClick={handleLoadMore}
                    className="group btn-load-more flex items-center gap-8 px-16 py-8 bg-gradient-to-br from-[var(--theme-card)] to-transparent hover:from-red-600 hover:to-red-500 border border-[var(--theme-border)] hover:border-red-500/50 rounded-[40px] transition-all duration-500 shadow-[var(--theme-shadow)] hover:shadow-red-600/20 active:scale-95"
                  >
                      <div className="flex flex-col items-start gap-1 text-left">
                          <span className="text-[11px] font-black uppercase tracking-[0.5em] group-hover:text-white text-[var(--theme-text-dim)] transition-colors">Afficher plus de vidéos</span>
                          <span className="text-[8px] font-medium text-[var(--theme-text-dim)] opacity-40 group-hover:text-white/60 uppercase tracking-widest transition-colors">Charger les résultats suivants</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[var(--theme-card-hover)] group-hover:bg-white/20 flex items-center justify-center transition-all border border-[var(--theme-border)]">
                          <i className="fas fa-chevron-down text-sm opacity-40 group-hover:opacity-100 group-hover:animate-bounce text-[var(--theme-text)] group-hover:text-white"></i>
                      </div>
                  </button>
              </motion.div>
            )}

            {isLoading && searchResults.length > 0 && (
                <div className="mt-20 flex justify-center">
                    <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                </div>
            )}

            {!hasMore && !isLoading && searchResults.length > 0 && (
                <div className="mt-20 flex flex-col items-center gap-4 opacity-20 pb-20">
                    <div className="w-1 bg-gradient-to-b from-red-600 to-transparent h-20 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Fin des résultats</span>
                </div>
            )}
          </section>

        </div>
      </main>

      <HistoryModal isOpen={modals.history} onClose={closeModals} />
      <FavoritesModal 
        isOpen={modals.favorites} 
        onClose={closeModals} 
        onAnalyze={(url) => handleAnalyze(url)} 
      />
      <QueueModal isOpen={modals.queue} onClose={closeModals} />
      <MenuModal isOpen={modals.menu} onClose={closeModals} />
      <UpdateModal isOpen={modals.update} onClose={closeModals} version={updateVersion} />
      
      <VideoPreviewModal 
        isOpen={modals.preview} 
        onClose={closeModals} 
        videoUrl={activeVideoUrl}
        onDownloadStarted={() => openExclusiveModal('queue')}
        onMiniPlayer={(data) => {
          setMiniPlayerVideo(data);
          closeModals();
        }}
      />

      {miniPlayerVideo && (
        <MiniPlayer 
          video={miniPlayerVideo} 
          onClose={() => setMiniPlayerVideo(null)} 
        />
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[150px] rounded-full animate-pulse ambiance-glow transition-colors duration-1000"
          style={{ backgroundColor: 'var(--theme-accent-glow)' }}
        ></div>
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[150px] rounded-full animate-pulse ambiance-glow transition-colors duration-1000"
          style={{ backgroundColor: 'var(--theme-accent-glow)', animationDelay: '2s' }}
        ></div>
      </div>
    </div>
  )
}

export default App
