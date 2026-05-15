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

  useEffect(() => {
    window.showUpdateModal = (version) => {
      setUpdateVersion(version);
      openExclusiveModal('update');
    };

    window.applyTheme = (themeId) => {
      const bgColors = {
          'black': '#000000', 'onyx': '#0a0a0a', 'dark': '#0f0f0f', 'charcoal': '#161616',
          'anthracite': '#1a1a1a', 'slate': '#262626', 'night': '#333333', 'metal': '#4d4d4d',
          'soft': '#f0f0f0', 'light': '#ffffff'
      };
      const targetColor = bgColors[themeId] || '#0f0f0f';
      document.body.style.backgroundColor = targetColor;
      document.documentElement.style.backgroundColor = targetColor;
      if (themeId === 'light' || themeId === 'soft') document.documentElement.classList.add('light-mode');
      else document.documentElement.classList.remove('light-mode');
    };

    if (isReady) {
      loadDiscovery("Musique", 1, false);
    }
  }, [isReady]);

  const loadDiscovery = async (query, page = 1, append = false) => {
    setIsLoading(true);
    try {
      const startOffset = (page - 1) * 20 + 1;
      const res = await callApi('search_videos', query, startOffset, 20, 0, 'mixed');
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
    loadDiscovery(currentQuery, nextPage, true);
  };

  const handleAnalyze = (query) => {
    if (query.includes('youtube.com/') || query.includes('youtu.be/')) {
       setActiveVideoUrl(query);
       openExclusiveModal('preview');
    } else {
       setCurrentQuery(query);
       setDiscoveryTitle(`Résultats pour : ${query}`);
       loadDiscovery(query, 1, false);
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
              <h2 className="text-xl font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-4">
                <i className="fas fa-fire text-red-600 text-lg animate-pulse"></i>
                <span>{discoveryTitle}</span>
              </h2>
              <div className="flex gap-2">
                  {['Musique', 'Gaming', 'Funny', 'Films'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => handleAnalyze(cat)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5"
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
                    <motion.div
                      key={video.url + index}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      onClick={() => handleAnalyze(video.url)}
                      className="group cursor-pointer flex flex-col gap-4 p-4 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-red-500/30 transition-all duration-500 relative"
                    >
                      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        
                        {/* Bouton Favoris Rapide */}
                        <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(video);
                          }}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-xl backdrop-blur-md flex items-center justify-center transition-all z-10 border ${isFavorite ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/40' : 'bg-black/60 border-white/10 text-white/40 hover:text-red-500 hover:scale-110'}`}
                        >
                          <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-[10px]`}></i>
                        </button>

                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-600/90 backdrop-blur-md rounded-lg text-[9px] font-black text-white border border-white/20 shadow-xl uppercase">
                          {video.type === 'playlist' ? 'PLAYLIST' : 'HD'}
                        </div>
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black text-white border border-white/10">
                          {video.duration}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl transform scale-50 group-hover:scale-100 transition-transform">
                            <i className="fas fa-play ml-1"></i>
                          </div>
                        </div>
                      </div>
                      <div className="px-2">
                        <h3 className="text-[14px] font-bold text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">{video.title}</h3>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                          {video.uploader}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
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
                    className="group flex items-center gap-8 px-16 py-8 bg-gradient-to-br from-white/[0.05] to-transparent hover:from-red-600 hover:to-red-500 border border-white/10 hover:border-red-500/50 rounded-[40px] transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-red-600/20 active:scale-95"
                  >
                      <div className="flex flex-col items-start gap-1 text-left">
                          <span className="text-[11px] font-black uppercase tracking-[0.5em] group-hover:text-white text-white/60 transition-colors">Afficher plus de vidéos</span>
                          <span className="text-[8px] font-medium text-white/20 group-hover:text-white/60 uppercase tracking-widest transition-colors">Charger les résultats suivants</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center transition-all">
                          <i className="fas fa-chevron-down text-sm opacity-40 group-hover:opacity-100 group-hover:animate-bounce text-white"></i>
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
      />

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  )
}

export default App
