import React from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const HistoryModal = ({ isOpen, onClose }) => {
    const { history, loadInitialData } = useAppState();
    const { callApi } = useApi();
    const [searchQuery, setSearchQuery] = React.useState('');

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
            {/* Barre de recherche */}
            <div className="mb-10 max-w-2xl mx-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center text-white/20 group-focus-within:text-red-500 transition-colors">
                        <i className="fas fa-search text-lg"></i>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Rechercher dans vos téléchargements..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-[32px] py-6 pl-16 pr-8 text-sm font-bold text-white focus:bg-white/[0.04] focus:border-red-500/50 outline-none transition-all shadow-inner"
                    />
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
                            className="group relative bg-white/[0.02] border border-white/5 p-8 rounded-[40px] flex items-center gap-8 hover:bg-white/[0.05] transition-all hover:border-red-500/20"
                        >
                            <img src={item.thumbnail} className="w-56 aspect-video rounded-[24px] object-cover shadow-2xl border border-white/5" alt="" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white truncate mb-2">{item.title}</h3>
                                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-black">
                                    <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{item.resolution}</span>
                                    <span className="text-white/40">{item.date}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => openFolder(item.folder)}
                                    className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-xl" 
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
