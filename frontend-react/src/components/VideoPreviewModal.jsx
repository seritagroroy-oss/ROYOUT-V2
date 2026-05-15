import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const VideoPreviewModal = ({ isOpen, onClose, videoUrl, onDownloadStarted }) => {
    const { callApi } = useApi();
    const { toggleFavorite, favorites } = useAppState();
    const [metadata, setMetadata] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [withSubtitles, setWithSubtitles] = useState(false);
    const [trimStart, setTrimStart] = useState('');
    const [trimEnd, setTrimEnd] = useState('');
    const [error, setError] = useState(null);
    
    const isFavorite = favorites?.some(f => f.url === videoUrl) || false;

    useEffect(() => {
        if (isOpen && videoUrl) {
            analyze();
        } else {
            setMetadata(null);
            setError(null);
            setSelectedLanguage(null);
            setWithSubtitles(false);
            setTrimStart('');
            setTrimEnd('');
        }
    }, [isOpen, videoUrl]);

    const analyze = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await callApi('get_video_info', videoUrl);
            if (res && (res.status === 'success' || res.status === 'playlist')) {
                setMetadata(res);
                // Sélectionner le meilleur format par défaut
                if (res.formats && res.formats.length > 0) {
                    setSelectedFormat(res.formats[0].id);
                } else if (res.status === 'playlist') {
                    setSelectedFormat('mp3_320'); // Par défaut pour playlist
                }
                // Langue par défaut si disponible
                if (res.languages && res.languages.length > 0) {
                    setSelectedLanguage(res.languages[0].id);
                }
            } else {
                setError(res?.message || "Impossible de charger les informations de la vidéo.");
            }
        } catch (err) {
            setError("Erreur de communication avec le serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedFormat) return;
        
        const options = {
            subtitles: withSubtitles,
            trim_start: trimStart,
            trim_end: trimEnd
        };

        if (metadata.status === 'playlist') {
            const res = await callApi('download_playlist', metadata.entries, selectedFormat, "");
            if (res.status === 'success') {
                if (onDownloadStarted) onDownloadStarted();
                else onClose();
            }
        } else {
            const res = await callApi('download_video', videoUrl, selectedFormat, "", selectedLanguage, options);
            if (res.status === 'success') {
                if (onDownloadStarted) onDownloadStarted();
                else onClose();
            }
        }
    };

    const renderPlaylistContent = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Infos Playlist */}
            <div className="flex flex-col gap-8">
                <div className="relative aspect-video rounded-[40px] overflow-hidden shadow-2xl border border-white/5">
                    <img src={metadata.entries[0]?.thumbnail} className="w-full h-full object-cover blur-sm opacity-50" alt="" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40">
                        <i className="fas fa-list text-5xl text-white/20"></i>
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-white">{metadata.count} VIDÉOS</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-white leading-tight tracking-tighter">{metadata.title}</h3>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-600/10 self-start px-4 py-2 rounded-full border border-red-600/20">
                        Mode Playlist
                    </p>
                </div>

                <div className="space-y-6 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Format de sortie pour tout</p>
                    <div className="grid grid-cols-2 gap-3">
                        {['mp3_320', 'mp3_128', 'bestvideo'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setSelectedFormat(f)}
                                className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedFormat === f ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                {f.replace('mp3_', '')} {f.includes('mp3') ? 'KBPS' : 'VIDEO'}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleDownload}
                        className="w-full bg-white text-black py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-2xl"
                    >
                        Tout Télécharger
                    </button>
                </div>
            </div>

            {/* Liste des vidéos */}
            <div className="lg:col-span-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                {metadata.entries.map((v, i) => (
                    <div key={i} className="flex items-center gap-6 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                        <div className="w-10 text-[10px] font-black text-white/10 group-hover:text-red-500 transition-colors">{(i + 1).toString().padStart(2, '0')}</div>
                        <img src={v.thumbnail} className="w-24 aspect-video object-cover rounded-xl shadow-lg" alt="" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white/80 line-clamp-1 group-hover:text-white transition-colors">{v.title}</p>
                        </div>
                        <i className="fas fa-chevron-right text-[10px] text-white/10"></i>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderVideoContent = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Gauche: Preview */}
            <div className="flex flex-col gap-10">
                <div className="relative aspect-video rounded-[48px] overflow-hidden shadow-2xl border border-white/5 group">
                    <img src={metadata.thumbnail} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl transform scale-75 group-hover:scale-100 transition-transform">
                            <i className="fas fa-play text-2xl ml-2"></i>
                        </button>
                    </div>
                </div>
                <div className="px-4 space-y-6">
                    <h3 className="text-4xl font-black text-white leading-tight tracking-tighter">{metadata.title}</h3>
                    <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Créateur</p>
                            <p className="text-sm font-bold text-white/60">{metadata.uploader}</p>
                        </div>
                        <button 
                            onClick={() => toggleFavorite({
                                url: videoUrl,
                                title: metadata.title,
                                thumbnail: metadata.thumbnail,
                                duration: metadata.duration
                            })}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all border ${isFavorite ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/20' : 'bg-white/5 border-white/5 text-white/20 hover:text-red-500'}`}
                        >
                            <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Droite: Options */}
            <div className="flex flex-col gap-10">
                {/* SECTION VIDÉO */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <i className="fas fa-video text-red-600"></i>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Qualités Vidéo (MP4)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {metadata.formats?.filter(f => f.type === 'video').map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setSelectedFormat(f.id)}
                                className={`
                                    p-6 rounded-[28px] border transition-all text-left flex flex-col gap-2
                                    ${selectedFormat === f.id 
                                        ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/30' 
                                        : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10'}
                                `}
                            >
                                <span className="text-sm font-black">{f.label}</span>
                                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{f.desc || 'MP4'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* SECTION AUDIO */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <i className="fas fa-music text-blue-500"></i>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Qualités Audio (MP3)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {metadata.formats?.filter(f => f.type === 'audio').map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setSelectedFormat(f.id)}
                                className={`
                                    p-6 rounded-[28px] border transition-all text-left flex flex-col gap-2
                                    ${selectedFormat === f.id 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/30' 
                                        : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10'}
                                `}
                            >
                                <span className="text-sm font-black">{f.label}</span>
                                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{f.desc || 'MP3'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* SECTION LANGUE (Si dispo) */}
                {metadata.languages && metadata.languages.length > 1 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <i className="fas fa-language text-purple-500"></i>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Langue Audio</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {metadata.languages.map(l => (
                                <button 
                                    key={l.id}
                                    onClick={() => setSelectedLanguage(l.id)}
                                    className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedLanguage === l.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* OPTIONS AVANCÉES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[40px] bg-white/[0.02] border border-white/5 shadow-inner">
                    {/* Sous-titres */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Sous-titres</p>
                        <button 
                            onClick={() => setWithSubtitles(!withSubtitles)}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${withSubtitles ? 'bg-teal-600/10 border-teal-500/50 text-teal-500' : 'bg-white/5 border-white/5 text-white/20'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Inclure les ST</span>
                            <div className={`w-10 h-5 rounded-full relative transition-all ${withSubtitles ? 'bg-teal-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${withSubtitles ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </button>
                    </div>

                    {/* Découpage */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Découpage (Trim)</p>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                placeholder="00:00"
                                value={trimStart}
                                onChange={(e) => setTrimStart(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white focus:border-red-600 outline-none transition-all"
                            />
                            <span className="text-white/20 text-xs">à</span>
                            <input 
                                type="text" 
                                placeholder="Fin"
                                value={trimEnd}
                                onChange={(e) => setTrimEnd(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white focus:border-red-600 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleDownload}
                    className="w-full bg-white text-black py-7 rounded-[32px] font-black text-sm uppercase tracking-[0.3em] transition-all hover:bg-red-600 hover:text-white shadow-2xl active:scale-95 border-4 border-transparent hover:border-white/20"
                >
                    Démarrer le téléchargement
                </button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={metadata?.status === 'playlist' ? "Aperçu Playlist" : "Analyse Vidéo"} fullScreen={true}>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                    <div className="w-20 h-20 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Analyse en cours...</p>
                </div>
            ) : metadata ? (
                metadata.status === 'playlist' ? renderPlaylistContent() : renderVideoContent()
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 text-3xl">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="max-w-md space-y-2">
                        <p className="text-lg font-black text-white uppercase tracking-tighter">Erreur d'analyse</p>
                        <p className="text-sm text-white/40 leading-relaxed">{error}</p>
                    </div>
                    <button 
                        onClick={analyze}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Réessayer l'analyse
                    </button>
                </div>
            ) : null}
        </Modal>
    );
};

export default VideoPreviewModal;
