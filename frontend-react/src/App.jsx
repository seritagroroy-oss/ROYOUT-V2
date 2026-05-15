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

// --- BRANCHEMENTS GLOBAUX (HORS COMPOSANT POUR DISPONIBILITÉ IMMÉDIATE) ---
window.showToast = (msg) => {
    console.log("RoYout Notification:", msg);
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
  const { setIsLoading, isLoading } = useAppState();
  const [searchResults, setSearchResults] = useState([]);
  const [discoveryTitle, setDiscoveryTitle] = useState('Découvrir');
  
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

  // Enregistrement des fonctions de retour Python -> React
  useEffect(() => {
    window.showUpdateModal = (version) => {
      setUpdateVersion(version);
      setModals(prev => ({ ...prev, update: true }));
    };

    window.applyTheme = (themeId) => {
      console.log("Changement de thème reçu:", themeId);
      const bgColors = {
          'black': '#000000',
          'onyx': '#0a0a0a',
          'dark': '#0f0f0f',
          'charcoal': '#161616',
          'anthracite': '#1a1a1a',
          'slate': '#262626',
          'night': '#333333',
          'metal': '#4d4d4d',
          'soft': '#f0f0f0',
          'light': '#ffffff'
      };
      const targetColor = bgColors[themeId] || '#0f0f0f';
      document.body.style.backgroundColor = targetColor;
      document.documentElement.style.backgroundColor = targetColor;
      
      if (themeId === 'light' || themeId === 'soft') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
      window.showToast(`Thème ${themeId} appliqué`);
    };

    if (isReady) {
      loadDiscovery();
    }
  }, [isReady]);

  const loadDiscovery = async (query = "Musique") => {
    setIsLoading(true);
    try {
      const res = await callApi('search_videos', query, 1, 20, 0, 'mixed');
      if (res && res.status === 'success') {
        setSearchResults(res.results);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = (query) => {
    if (query.includes('youtube.com/') || query.includes('youtu.be/')) {
       setActiveVideoUrl(query);
       toggleModal('preview', true);
    } else {
       setDiscoveryTitle(`Résultats pour : ${query}`);
       loadDiscovery(query);
    }
  };

  const toggleModal = (name, state) => {
    setModals(prev => ({ ...prev, [name]: state }));
  };

  return (
    <div className="h-screen text-white flex flex-col font-['Outfit'] select-none overflow-hidden transition-all duration-700">
      <SplashScreen />

      <Navbar 
        onOpenHistory={() => toggleModal('history', true)}
        onOpenFavorites={() => toggleModal('favorites', true)}
        onOpenQueue={() => toggleModal('queue', true)}
        onOpenMenu={() => toggleModal('menu', true)}
      />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar px-8 scroll-smooth">
        <div className="max-w-7xl mx-auto pb-40">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 3.2 }}
          >
            <SearchSection onAnalyze={handleAnalyze} />
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
                {searchResults.map((video, index) => (
                  <motion.div
                    key={video.url + index}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: (index * 0.05) + 3.6 }}
                    onClick={() => handleAnalyze(video.url)}
                    className="group cursor-pointer flex flex-col gap-4 p-4 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-red-500/30 transition-all duration-500"
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
                ))}
              </AnimatePresence>
            </div>
          </section>

        </div>
      </main>

      <HistoryModal isOpen={modals.history} onClose={() => toggleModal('history', false)} />
      <FavoritesModal 
        isOpen={modals.favorites} 
        onClose={() => toggleModal('favorites', false)} 
        onAnalyze={(url) => handleAnalyze(url)} 
      />
      <QueueModal isOpen={modals.queue} onClose={() => toggleModal('queue', false)} />
      <MenuModal isOpen={modals.menu} onClose={() => toggleModal('menu', false)} />
      <UpdateModal isOpen={modals.update} onClose={() => toggleModal('update', false)} version={updateVersion} />
      
      <VideoPreviewModal 
        isOpen={modals.preview} 
        onClose={() => toggleModal('preview', false)} 
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
