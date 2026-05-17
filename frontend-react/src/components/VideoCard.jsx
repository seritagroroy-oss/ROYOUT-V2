import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';

const VideoCard = ({ video, isFavorite, onToggleFavorite, onClick, isSelected, onToggleSelect }) => {
    const { callApi } = useApi();
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [streamUrl, setStreamUrl] = useState(null);
    const [isLoadingStream, setIsLoadingStream] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const hoverTimer = useRef(null);
    const videoRef = useRef(null);

    const handleMouseEnter = () => {
        if (video.type === 'playlist') return;
        
        // Délai augmenté pour éviter les déclenchements accidentels (1.2s)
        hoverTimer.current = setTimeout(async () => {
            setIsPreviewing(true);
            if (!streamUrl) {
                setIsLoadingStream(true);
                try {
                    const res = await callApi('get_stream_url', video.url);
                    if (res && res.status === 'success') {
                        setStreamUrl(res.url);
                    }
                } catch (err) {
                    console.error("Erreur preview:", err);
                } finally {
                    setIsLoadingStream(false);
                }
            }
        }, 1200);
    };

    const handleMouseLeave = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setIsPreviewing(false);
        setPreviewProgress(0);
        setIsMuted(true); // Remettre en muet pour la prochaine fois
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                video-card-parent group cursor-pointer flex flex-col gap-4 p-4 rounded-[32px] bg-[var(--theme-card)] border transition-all duration-500 relative shadow-[var(--theme-shadow)]
                ${isSelected ? 'border-red-500 bg-red-500/10' : 'border-[var(--theme-border)] hover:bg-[var(--theme-card-hover)] hover:border-red-500/30'}
            `}
        >
            {/* Tooltip d'information */}
            <div className="preview-tooltip">
                <span className="tooltip-tag">Propulsé par RoYout</span>
                <span>{video.uploader} • {video.duration}</span>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                {/* Image de couverture */}
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${isPreviewing && streamUrl ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`} 
                />
                
                {/* Lecteur Preview */}
                <AnimatePresence>
                    {isPreviewing && streamUrl && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 w-full h-full"
                        >
                            <video 
                                ref={videoRef}
                                src={streamUrl} 
                                autoPlay 
                                muted={isMuted}
                                loop
                                playsInline
                                onTimeUpdate={(e) => {
                                    const percent = (e.target.currentTime / e.target.duration) * 100;
                                    setPreviewProgress(percent);
                                }}
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Bouton de Volume */}
                            <button 
                                onClick={toggleMute}
                                className={`absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center z-50 transition-all border border-white/20 shadow-lg ${isMuted ? 'bg-red-600/40 text-white/70 hover:bg-red-600 hover:text-white' : 'bg-red-600 text-white shadow-red-600/40'}`}
                            >
                                <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-[10px]`}></i>
                            </button>

                            {/* Barre de progression de l'aperçu */}
                            <div 
                                className="preview-progress-bar" 
                                style={{ width: `${previewProgress}%` }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Spinner de chargement */}
                {isLoadingStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all z-10">
                        <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                    </div>
                )}
                
                {/* Bouton Sélection (Optionnel) */}
                {onToggleSelect && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect(video.url || video.id);
                        }}
                        className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-all z-20 ${isSelected ? 'bg-red-600 scale-110' : 'bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/60'}`}
                    >
                        <i className={`fas ${isSelected ? 'fa-check' : 'fa-circle'} text-[10px]`}></i>
                    </button>
                )}

                {/* Bouton Favoris Rapide (Optionnel) */}
                {onToggleFavorite && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(video);
                        }}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-xl backdrop-blur-md flex items-center justify-center transition-all z-20 border ${isFavorite ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/40' : 'bg-black/60 border-white/10 text-white/40 hover:text-red-500 hover:scale-110'}`}
                    >
                        <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-[10px]`}></i>
                    </button>
                )}

                <div className="badge-type absolute top-3 left-3 px-2.5 py-1 bg-red-600/90 backdrop-blur-md rounded-lg text-[9px] font-black text-white border border-white/20 shadow-xl uppercase">
                    {video.type === 'playlist' ? 'PLAYLIST' : 'HD'}
                </div>
                <div className="badge-duration absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black text-white border border-white/10">
                    {video.duration}
                </div>

                {/* Overlay Play (uniquement si pas en train de previewer) */}
                {!isPreviewing && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl transform scale-50 group-hover:scale-100 transition-transform">
                            <i className="fas fa-play ml-1"></i>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-2">
                <h3 className="text-[14px] font-bold text-[var(--theme-text)] line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">{video.title}</h3>
                <p className="text-[10px] text-[var(--theme-text-dim)] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    {video.uploader}
                </p>
            </div>
        </motion.div>
    );
};

export default VideoCard;
