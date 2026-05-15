import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const QueueModal = ({ isOpen, onClose }) => {
    const { callApi } = useApi();
    const { queueCount } = useAppState();
    const [queue, setQueue] = useState([]);
    const [taskStates, setTaskStates] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Branchement global pour recevoir la progression du backend
        window.updateProgress = (url, p, s, e, ph) => {
            setTaskStates(prev => ({
                ...prev,
                [url]: { progress: p, speed: s, eta: e, phase: ph }
            }));
        };

        window.onDownloadComplete = (url, status, msg) => {
            setTaskStates(prev => {
                const newState = { ...prev };
                if (status === 'success') {
                    delete newState[url]; // Retirer si fini
                } else {
                    newState[url] = { ...newState[url], status: 'error' };
                }
                return newState;
            });
            loadQueue();
        };

        window.resetProgress = (url) => {
            setTaskStates(prev => ({
                ...prev,
                [url]: { progress: 0, speed: '', eta: '', phase: '' }
            }));
        };

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
                // On fusionne les tâches actives du backend dans notre state local si besoin
                if (res.active) {
                    res.active.forEach(t => {
                        if (!taskStates[t.url]) {
                            setTaskStates(prev => ({ ...prev, [t.url]: { progress: 0, is_active: true } }));
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Queue refresh error", err);
        }
    };

    const activeUrls = Object.keys(taskStates);
    // On affiche d'abord les tâches actives, puis le reste de la file
    const activeTasks = queue.filter(t => activeUrls.includes(t.url));
    const pendingTasks = queue.filter(t => !activeUrls.includes(t.url));
    const allItems = [...activeTasks, ...pendingTasks];

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
                        const state = taskStates[item.url] || {};
                        const isActive = !!state.progress || activeUrls.includes(item.url);
                        
                        return (
                            <div 
                                key={index}
                                className={`group relative bg-white/[0.02] border border-white/5 p-8 rounded-[40px] flex items-center gap-8 transition-all ${isActive ? 'bg-white/[0.05] border-red-500/20' : ''}`}
                            >
                                <div className="relative w-24 h-24 rounded-[28px] overflow-hidden flex-shrink-0 shadow-2xl">
                                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                                    {isActive && (
                                        <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-black text-white truncate pr-10">{item.title}</h4>
                                        <span className="px-4 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40">
                                            {item.resolution}
                                        </span>
                                    </div>

                                    {isActive ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-red-500">{state.phase || 'Téléchargement'}</span>
                                                <div className="flex items-center gap-4 text-white/40">
                                                    <span>{state.speed}</span>
                                                    <span>{state.eta}</span>
                                                    <span className="text-white">{state.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-red-600 transition-all duration-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                                                    style={{ width: `${state.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-white/20">
                                            <i className="fas fa-clock text-[10px]"></i>
                                            <span className="text-[10px] font-black uppercase tracking-widest">En attente...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
};

export default QueueModal;
