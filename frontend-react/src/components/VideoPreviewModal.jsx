import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const VideoPreviewModal = ({ isOpen, onClose, videoUrl, onDownloadStarted, onMiniPlayer }) => {
    const { callApi } = useApi();
    const { toggleFavorite, favorites } = useAppState();
    const [metadata, setMetadata] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [withSubtitles, setWithSubtitles] = useState(false);
    const [trimStart, setTrimStart] = useState('');
    const [trimEnd, setTrimEnd] = useState('');
    const [aiSummary, setAiSummary] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPlayingInline, setIsPlayingInline] = useState(false);
    const [inlineStreamUrl, setInlineStreamUrl] = useState(null);
    const [isStreamLoading, setIsStreamLoading] = useState(false);
    
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
            setAiSummary(null);
            setIsAiLoading(false);
            setIsPlayingInline(false);
            setInlineStreamUrl(null);
        }
    }, [isOpen, videoUrl]);

    const handlePlayInline = async () => {
        if (inlineStreamUrl) {
            setIsPlayingInline(true);
            return;
        }
        
        setIsStreamLoading(true);
        try {
            const res = await callApi('get_stream_url', videoUrl);
            if (res && res.status === 'success') {
                setInlineStreamUrl(res.url);
                setIsPlayingInline(true);
            }
        } finally {
            setIsStreamLoading(false);
        }
    };

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
                // Déclencher le thème ambiant
                if (window.updateAmbiantTheme && res.thumbnail) {
                    window.updateAmbiantTheme(res.thumbnail);
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

    const loadAiSummary = async () => {
        setIsAiLoading(true);
        try {
            const res = await callApi('get_ai_summary', videoUrl);
            if (res && res.status === 'success') {
                setAiSummary(res);
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const renderPlaylistContent = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Infos Playlist */}
            <div className="flex flex-col gap-8">
                <div className="relative aspect-video rounded-[40px] overflow-hidden shadow-2xl border border-[var(--theme-border)]">
                    <img src={metadata.entries[0]?.thumbnail} className="w-full h-full object-cover blur-sm opacity-50" alt="" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40">
                        <i className="fas fa-list text-5xl text-white/20"></i>
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-white">{metadata.count} VIDÉOS</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-[var(--theme-text)] leading-tight tracking-tighter">{metadata.title}</h3>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-600/10 self-start px-4 py-2 rounded-full border border-red-600/20">
                        Mode Playlist
                    </p>
                </div>

                <div className="space-y-6 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-dim)]">Format de sortie pour tout</p>
                    <div className="grid grid-cols-2 gap-3">
                        {['mp3_320', 'mp3_128', 'bestvideo'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setSelectedFormat(f)}
                                className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedFormat === f ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text-dim)] hover:bg-[var(--theme-card-hover)]'}`}
                            >
                                {f.replace('mp3_', '')} {f.includes('mp3') ? 'KBPS' : 'VIDEO'}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleDownload}
                        className="w-full bg-[var(--theme-text)] text-[var(--theme-bg)] py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-2xl"
                    >
                        Tout Télécharger
                    </button>
                </div>
            </div>

            {/* Liste des vidéos */}
            <div className="lg:col-span-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                {metadata.entries.map((v, i) => (
                    <div key={i} className="flex items-center gap-6 p-4 rounded-3xl bg-[var(--theme-card)] border border-[var(--theme-border)] hover:bg-[var(--theme-card-hover)] transition-all group shadow-[var(--theme-shadow)]">
                        <div className="w-10 text-[10px] font-black text-[var(--theme-text-dim)] opacity-20 group-hover:text-red-500 transition-colors">{(i + 1).toString().padStart(2, '0')}</div>
                        <img src={v.thumbnail} className="w-24 aspect-video object-cover rounded-xl shadow-lg border border-[var(--theme-border)]" alt="" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[var(--theme-text)] opacity-80 line-clamp-1 group-hover:text-red-500 transition-colors">{v.title}</p>
                        </div>
                        <i className="fas fa-chevron-right text-[10px] text-[var(--theme-text-dim)] opacity-10"></i>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderVideoContent = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Gauche: Preview */}
            <div className="flex flex-col gap-10">
                <div className="relative aspect-video rounded-[48px] overflow-hidden shadow-2xl border border-[var(--theme-border)] group bg-black">
                    {!isPlayingInline ? (
                        <>
                            <img src={metadata.thumbnail} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                                <button 
                                    onClick={handlePlayInline}
                                    disabled={isStreamLoading}
                                    className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl transform scale-90 group-hover:scale-100 transition-transform disabled:opacity-50"
                                >
                                    {isStreamLoading ? (
                                        <i className="fas fa-circle-notch fa-spin text-2xl"></i>
                                    ) : (
                                        <i className="fas fa-play text-2xl ml-2"></i>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <video 
                            src={inlineStreamUrl} 
                            autoPlay 
                            controls 
                            className="w-full h-full object-cover"
                        />
                    )}
                    
                    <div className="absolute top-6 right-6">
                        <button 
                            onClick={() => onMiniPlayer({ url: videoUrl, title: metadata.title, thumbnail: metadata.thumbnail })}
                            className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10 hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <i className="fas fa-external-link-alt mr-2"></i>
                            Mini-Lecteur
                        </button>
                    </div>
                </div>
                <div className="px-4 space-y-6">
                    <h3 className="text-4xl font-black text-[var(--theme-text)] leading-tight tracking-tighter">{metadata.title}</h3>
                    <div className="flex items-center justify-between p-6 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[32px] shadow-[var(--theme-shadow)]">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Créateur</p>
                            <p className="text-sm font-bold text-[var(--theme-text-dim)]">{metadata.uploader}</p>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={loadAiSummary}
                                disabled={isAiLoading}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                            >
                                {isAiLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
                            </button>
                            <button 
                                onClick={() => toggleFavorite({
                                    url: videoUrl,
                                    title: metadata.title,
                                    thumbnail: metadata.thumbnail,
                                    duration: metadata.duration
                                })}
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all border ${isFavorite ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/20' : 'bg-[var(--theme-card-hover)] border-[var(--theme-border)] text-[var(--theme-text-dim)] hover:text-red-500'}`}
                            >
                                <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Zone Résumé IA */}
                    <AnimatePresence>
                        {aiSummary && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-8 rounded-[32px] bg-indigo-600/5 border border-indigo-500/20 space-y-6"
                            >
                                <div className="flex items-center gap-4 text-indigo-500">
                                    <i className="fas fa-sparkles"></i>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Résumé Intelligent RoYout</h4>
                                </div>
                                <p className="text-sm text-[var(--theme-text)] leading-relaxed italic opacity-80">
                                    "{aiSummary.summary}"
                                </p>
                                {aiSummary.metadata && (
                                    <div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest text-indigo-400/60 border-t border-indigo-500/10 pt-4">
                                        <span className="flex items-center gap-2"><i className="fas fa-eye text-[8px]"></i> {aiSummary.metadata.views.toLocaleString()} VUES</span>
                                        <span className="flex items-center gap-2"><i className="fas fa-calendar text-[8px]"></i> {aiSummary.metadata.date}</span>
                                        <span className="flex items-center gap-2"><i className="fas fa-theater-masks text-[8px]"></i> {aiSummary.metadata.tone}</span>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {aiSummary.points.map((p, i) => (
                                        <div key={i} className="flex items-start gap-4 text-[11px] font-bold text-[var(--theme-text-dim)]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                                            <span>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Droite: Options */}
            <div className="flex flex-col gap-10">
                {/* SECTION VIDÉO */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <i className="fas fa-video text-red-600"></i>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-dim)]">Qualités Vidéo (MP4)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {metadata.formats?.filter(f => f.type === 'video').map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setSelectedFormat(f.id)}
                                className={`
                                    p-6 rounded-[28px] border transition-all text-left flex flex-col gap-2 shadow-[var(--theme-shadow)]
                                    ${selectedFormat === f.id 
                                        ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/30' 
                                        : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-card-hover)]'}
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
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-dim)]">Qualités Audio (MP3)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {metadata.formats?.filter(f => f.type === 'audio').map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setSelectedFormat(f.id)}
                                className={`
                                    p-6 rounded-[28px] border transition-all text-left flex flex-col gap-2 shadow-[var(--theme-shadow)]
                                    ${selectedFormat === f.id 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/30' 
                                        : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-card-hover)]'}
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
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-dim)]">Langue Audio</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {metadata.languages.map(l => (
                                <button 
                                    key={l.id}
                                    onClick={() => setSelectedLanguage(l.id)}
                                    className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedLanguage === l.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30' : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text-dim)] hover:bg-[var(--theme-card-hover)]'}`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* OPTIONS AVANCÉES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[40px] bg-[var(--theme-card)] border border-[var(--theme-border)] shadow-inner">
                    {/* Sous-titres */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-dim)]">Sous-titres</p>
                        <button 
                            onClick={() => setWithSubtitles(!withSubtitles)}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${withSubtitles ? 'bg-teal-600/10 border-teal-500/50 text-teal-500' : 'bg-[var(--theme-card-hover)] border-[var(--theme-border)] text-[var(--theme-text-dim)]'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Inclure les ST</span>
                            <div className={`w-10 h-5 rounded-full relative transition-all ${withSubtitles ? 'bg-teal-500' : 'bg-[var(--theme-text-dim)] opacity-20'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${withSubtitles ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </button>
                    </div>

                    {/* Découpage */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-dim)]">Découpage (Trim)</p>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                placeholder="00:00"
                                value={trimStart}
                                onChange={(e) => setTrimStart(e.target.value)}
                                className="w-full bg-[var(--theme-card-hover)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[10px] font-black text-[var(--theme-text)] focus:border-red-600 outline-none transition-all"
                            />
                            <span className="text-[var(--theme-text-dim)] text-xs">à</span>
                            <input 
                                type="text" 
                                placeholder="Fin"
                                value={trimEnd}
                                onChange={(e) => setTrimEnd(e.target.value)}
                                className="w-full bg-[var(--theme-card-hover)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[10px] font-black text-[var(--theme-text)] focus:border-red-600 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleDownload}
                    className="w-full bg-[var(--theme-text)] text-[var(--theme-bg)] py-7 rounded-[32px] font-black text-sm uppercase tracking-[0.3em] transition-all hover:bg-red-600 hover:text-white shadow-2xl active:scale-95 border-4 border-transparent hover:border-[var(--theme-border)]"
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
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--theme-text-dim)]">Analyse en cours...</p>
                </div>
            ) : metadata ? (
                metadata.status === 'playlist' ? renderPlaylistContent() : renderVideoContent()
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 text-3xl">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="max-w-md space-y-2">
                        <p className="text-lg font-black text-[var(--theme-text)] uppercase tracking-tighter">Erreur d'analyse</p>
                        <p className="text-sm text-[var(--theme-text-dim)] leading-relaxed">{error}</p>
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
