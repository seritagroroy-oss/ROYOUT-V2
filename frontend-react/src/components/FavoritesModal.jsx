import React from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';

const FavoritesModal = ({ isOpen, onClose, onAnalyze }) => {
    const { favorites, toggleFavorite } = useAppState();

    const handleAnalyze = (url) => {
        onAnalyze(url);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mes Favoris" fullScreen={true}>
            {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <i className="fas fa-heart text-[120px] mb-10"></i>
                    <p className="text-2xl font-black uppercase tracking-[0.5em]">Aucun favori</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {favorites.map((f, index) => (
                        <div 
                            key={f.url || index}
                            className="group relative bg-[var(--theme-card)] border border-[var(--theme-border)] p-6 rounded-[40px] flex flex-col gap-6 hover:bg-[var(--theme-card-hover)] transition-all hover:border-red-500/20 shadow-[var(--theme-shadow)]"
                        >
                            <div className="relative aspect-video rounded-[24px] overflow-hidden shadow-2xl border border-[var(--theme-border)]">
                                <img src={f.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/10 text-white">{f.duration}</div>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleAnalyze(f.url)}
                                        className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl transform scale-50 group-hover:scale-100 transition-transform"
                                    >
                                        <i className="fas fa-play ml-1"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="px-2 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-[var(--theme-text)] truncate mb-1 group-hover:text-red-500 transition-colors">{f.title}</h3>
                                    <p className="text-[10px] text-[var(--theme-text-dim)] font-black uppercase tracking-[0.3em]">YouTube Premium Content</p>
                                </div>
                                <button 
                                    onClick={() => toggleFavorite(f)}
                                    className="w-12 h-12 rounded-2xl bg-[var(--theme-card-hover)] hover:bg-red-600/20 flex items-center justify-center text-[var(--theme-text-dim)] hover:text-red-500 transition-all shrink-0 border border-[var(--theme-border)]" 
                                    title="Supprimer"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default FavoritesModal;
