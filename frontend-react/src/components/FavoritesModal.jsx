import React from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import VideoCard from './VideoCard';

const FavoritesModal = ({ isOpen, onClose, onAnalyze }) => {
    const { favorites, toggleFavorite } = useAppState();
    const [selectedUrls, setSelectedUrls] = React.useState(new Set());

    const toggleSelect = (url) => {
        const newSelected = new Set(selectedUrls);
        if (newSelected.has(url)) newSelected.delete(url);
        else newSelected.add(url);
        setSelectedUrls(newSelected);
    };

    const deleteSelected = async () => {
        if (selectedUrls.size === 0) return;
        // Pour les favoris, on doit passer l'objet complet à toggleFavorite pour le trouver/supprimer
        const toDelete = favorites.filter(f => selectedUrls.has(f.url));
        for (const item of toDelete) {
            await toggleFavorite(item);
        }
        setSelectedUrls(new Set());
    };

    const handleAnalyze = (url) => {
        onAnalyze(url);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mes Favoris" fullScreen={true}>
            <div className="flex justify-end mb-10 max-w-7xl mx-auto w-full">
                {selectedUrls.size > 0 && (
                    <button 
                        onClick={deleteSelected}
                        className="px-8 py-5 bg-red-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 animate-in fade-in zoom-in"
                    >
                        Supprimer ({selectedUrls.size})
                    </button>
                )}
            </div>

            {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <i className="fas fa-heart text-[120px] mb-10"></i>
                    <p className="text-2xl font-black uppercase tracking-[0.5em]">Aucun favori</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {favorites.map((f, index) => (
                        <VideoCard 
                            key={f.url || index}
                            video={f}
                            isFavorite={true}
                            onToggleFavorite={toggleFavorite}
                            isSelected={selectedUrls.has(f.url)}
                            onToggleSelect={toggleSelect}
                            onClick={() => handleAnalyze(f.url)}
                        />
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default FavoritesModal;
