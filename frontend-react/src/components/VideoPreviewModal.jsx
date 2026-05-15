import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const VideoPreviewModal = ({ isOpen, onClose, videoUrl }) => {
    const { callApi } = useApi();
    const { toggleFavorite, favorites } = useAppState();
    const [metadata, setMetadata] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState(null);
    
    const isFavorite = favorites.some(f => f.url === videoUrl);

    useEffect(() => {
        if (isOpen && videoUrl) {
            analyze();
        } else {
            setMetadata(null);
        }
    }, [isOpen, videoUrl]);

    const analyze = async () => {
        setIsLoading(true);
        try {
            const res = await callApi('get_video_info', videoUrl);
            if (res && res.status === 'success') {
                setMetadata(res);
                // Sélectionner le meilleur format par défaut
                if (res.formats && res.formats.length > 0) {
                    setSelectedFormat(res.formats[0].id);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedFormat) return;
        const res = await callApi('download_video', videoUrl, selectedFormat, "");
        if (res.status === 'success') {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Analyse Vidéo" maxWidth="max-w-5xl">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                    <div className="w-20 h-20 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Extraction des formats...</p>
                </div>
            ) : metadata ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Gauche: Preview */}
                    <div className="flex flex-col gap-6">
                        <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-2xl border border-white/5 group">
                            <img src={metadata.thumbnail} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl transform scale-75 group-hover:scale-100 transition-transform">
                                    <i className="fas fa-play ml-1"></i>
                                </button>
                            </div>
                        </div>
                        <div className="px-2">
                            <h3 className="text-xl font-black text-white leading-tight mb-2">{metadata.title}</h3>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{metadata.uploader}</p>
                                <button 
                                    onClick={() => toggleFavorite({
                                        url: videoUrl,
                                        title: metadata.title,
                                        thumbnail: metadata.thumbnail,
                                        duration: metadata.duration
                                    })}
                                    className={`text-xl transition-all hover:scale-110 ${isFavorite ? 'text-red-500' : 'text-white/20'}`}
                                >
                                    <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Droite: Options */}
                    <div className="flex flex-col gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Choisir la qualité</p>
                            <div className="grid grid-cols-2 gap-3">
                                {metadata.formats?.map(f => (
                                    <button 
                                        key={f.id}
                                        onClick={() => setSelectedFormat(f.id)}
                                        className={`
                                            p-4 rounded-2xl border transition-all text-left flex flex-col gap-1
                                            ${selectedFormat === f.id 
                                                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                                                : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}
                                        `}
                                    >
                                        <span className="text-xs font-black">{f.label}</span>
                                        <span className="text-[9px] opacity-60 uppercase tracking-widest">{f.ext} • {f.filesize}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleDownload}
                            className="w-full bg-white text-black py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-red-600 hover:text-white shadow-2xl active:scale-95 mt-auto"
                        >
                            Démarrer le téléchargement
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-red-500 font-bold">
                    Impossible de charger les informations de la vidéo.
                </div>
            )}
        </Modal>
    );
};

export default VideoPreviewModal;
