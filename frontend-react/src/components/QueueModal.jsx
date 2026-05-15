import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const QueueModal = ({ isOpen, onClose }) => {
    const { callApi } = useApi();
    const { queueCount } = useAppState();
    const [queue, setQueue] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadQueue();
            const interval = setInterval(loadQueue, 2000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const loadQueue = async () => {
        try {
            const res = await callApi('get_queue');
            if (res) {
                setQueue(res.queue || []);
                setCurrentTask(res.current);
            }
        } catch (err) {
            console.error("Queue refresh error", err);
        }
    };

    const allItems = currentTask ? [currentTask, ...queue] : queue;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="File d'attente" fullScreen={true}>
            {isLoading && allItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-20 h-20 border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-white/20">Synchronisation...</p>
                </div>
            ) : allItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <i className="fas fa-list-ol text-[120px] mb-10"></i>
                    <p className="text-2xl font-black uppercase tracking-[0.5em]">La file est vide</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 pb-20">
                    {allItems.map((item, index) => {
                        const isCurrent = currentTask && item.url === currentTask.url && index === 0;
                        return (
                        <div 
                            key={index + (item.url || '')}
                            className={`group relative border p-8 rounded-[40px] flex items-center gap-10 transition-all ${isCurrent ? 'bg-red-600/5 border-red-600/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${isCurrent ? 'bg-red-600 text-white' : 'bg-red-600/10 text-red-500'}`}>
                                {isCurrent ? <i className="fas fa-arrow-right animate-pulse"></i> : index + 1}
                            </div>
                            <img src={item.thumbnail} className="w-48 aspect-video rounded-3xl object-cover shadow-2xl border border-white/5" alt="" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white truncate mb-2">{item.title}</h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white/40">
                                        <i className={`fas ${isCurrent ? 'fa-spinner fa-spin text-red-500' : 'fa-cog text-white/20'}`}></i>
                                        Format: <span className="text-white">{item.resolution || item.format_id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white/40">
                                        <i className="fas fa-folder"></i>
                                        Dossier: <span className="text-white truncate max-w-[200px]">{item.folder}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border ${isCurrent ? 'bg-red-600 text-white border-red-400 animate-pulse' : 'bg-red-600/10 text-red-500 border-red-600/20'}`}>
                                    {isCurrent ? 'Téléchargement...' : 'En attente'}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </Modal>
    );
};

export default QueueModal;
