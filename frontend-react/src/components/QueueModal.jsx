import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const QueueModal = ({ isOpen, onClose }) => {
    const { callApi } = useApi();
    const { queueCount } = useAppState();
    const [queue, setQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadQueue();
        }
    }, [isOpen]);

    const loadQueue = async () => {
        setIsLoading(true);
        try {
            const res = await callApi('get_queue');
            if (res) setQueue(res.queue || []);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="File d'attente" fullScreen={true}>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-20 h-20 border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-white/20">Synchronisation...</p>
                </div>
            ) : queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <i className="fas fa-list-ol text-[120px] mb-10"></i>
                    <p className="text-2xl font-black uppercase tracking-[0.5em]">La file est vide</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 pb-20">
                    {queue.map((item, index) => (
                        <div 
                            key={index}
                            className="group relative bg-white/[0.02] border border-white/5 p-8 rounded-[40px] flex items-center gap-10 hover:bg-white/[0.05] transition-all"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 font-black text-2xl">
                                {index + 1}
                            </div>
                            <img src={item.thumbnail} className="w-48 aspect-video rounded-3xl object-cover shadow-2xl border border-white/5" alt="" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white truncate mb-2">{item.title}</h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white/40">
                                        <i className="fas fa-cog fa-spin text-red-500"></i>
                                        Format: <span className="text-white">{item.resolution || item.format_id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white/40">
                                        <i className="fas fa-folder"></i>
                                        Dossier: <span className="text-white truncate max-w-[200px]">{item.folder}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="px-6 py-3 rounded-2xl bg-red-600/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] border border-red-600/20">
                                    En attente
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default QueueModal;
