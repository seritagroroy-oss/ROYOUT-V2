import React from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const HistoryModal = ({ isOpen, onClose }) => {
    const { history, loadInitialData } = useAppState();
    const { callApi } = useApi();
    const [searchQuery, setSearchQuery] = React.useState('');

    const [selectedItems, setSelectedItems] = React.useState(new Set());

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedItems(newSelected);
    };

    const deleteSelected = async () => {
        if (selectedItems.size === 0) return;
        setIsLoading(true);
        for (const id of selectedItems) {
            await callApi('delete_history_item', id);
        }
        setSelectedItems(new Set());
        loadInitialData();
        setIsLoading(false);
    };

    const clearAll = async () => {
        if (!window.confirm("Tout effacer ?")) return;
        const success = await callApi('clear_history');
        if (success) loadInitialData();
    };

    const deleteItem = async (id) => {
        const success = await callApi('delete_history_item', id);
        if (success) loadInitialData();
    };

    const openFolder = (folder) => {
        callApi('open_download_folder', folder);
    };

    const filteredHistory = history.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.resolution.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Historique" fullScreen={true}>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 max-w-5xl mx-auto w-full">
                {/* Barre de recherche */}
                <div className="relative group flex-1 w-full">
                    <div className="absolute inset-y-0 left-6 flex items-center text-[var(--theme-text-dim)] group-focus-within:text-red-500 transition-colors">
                        <i className="fas fa-search text-lg"></i>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[32px] py-6 pl-16 pr-8 text-sm font-bold text-[var(--theme-text)] focus:bg-[var(--theme-card-hover)] focus:border-red-500/50 outline-none transition-all shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {selectedItems.size > 0 && (
                        <button 
                            onClick={deleteSelected}
                            className="px-8 py-5 bg-red-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 animate-in fade-in zoom-in"
                        >
                            Supprimer ({selectedItems.size})
                        </button>
                    )}
                    <button 
                        onClick={clearAll}
                        className="px-8 py-5 bg-[var(--theme-card)] text-red-500 border border-red-500/20 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-red-600/10 transition-all"
                    >
                        Tout effacer
                    </button>
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <i className="fas fa-history text-[120px] mb-10"></i>
                    <p className="text-2xl font-black uppercase tracking-[0.5em]">{searchQuery ? "Aucun résultat" : "Aucun historique"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {filteredHistory.map((item, index) => (
                        <div 
                            key={item.id || index}
                            onClick={() => toggleSelect(item.id)}
                            className={`
                                group relative bg-[var(--theme-card)] border p-8 rounded-[40px] flex items-center gap-8 transition-all shadow-[var(--theme-shadow)] cursor-pointer
                                ${selectedItems.has(item.id) ? 'border-red-500 bg-red-500/5' : 'border-[var(--theme-border)] hover:bg-[var(--theme-card-hover)]'}
                            `}
                        >
                            <div className="relative">
                                <img src={item.thumbnail} className="w-56 aspect-video rounded-[24px] object-cover shadow-2xl border border-[var(--theme-border)]" alt="" />
                                {selectedItems.has(item.id) && (
                                    <div className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                                        <i className="fas fa-check text-xs"></i>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-[var(--theme-text)] truncate mb-2">{item.title}</h3>
                                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-black">
                                    <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{item.resolution}</span>
                                    <span className="text-[var(--theme-text-dim)]">{item.date}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                                <button 
                                    onClick={() => openFolder(item.folder)}
                                    className="w-14 h-14 rounded-2xl bg-[var(--theme-card-hover)] hover:bg-white/10 flex items-center justify-center text-[var(--theme-text-dim)] hover:text-white transition-all shadow-xl border border-[var(--theme-border)]" 
                                    title="Ouvrir le dossier"
                                >
                                    <i className="fas fa-folder-open text-lg"></i>
                                </button>
                                <button 
                                    onClick={() => deleteItem(item.id)}
                                    className="w-14 h-14 rounded-2xl bg-red-600/10 hover:bg-red-600/20 flex items-center justify-center text-red-500 transition-all shadow-xl" 
                                    title="Supprimer"
                                >
                                    <i className="fas fa-trash-alt text-lg"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default HistoryModal;
