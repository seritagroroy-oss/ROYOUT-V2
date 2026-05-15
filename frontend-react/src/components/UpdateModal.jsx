import React from 'react';
import Modal from './Modal';
import { useApi } from '../hooks/useApi';

const UpdateModal = ({ isOpen, onClose, version }) => {
    const { callApi } = useApi();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mise à jour disponible" fullScreen={true}>
            <div className="flex flex-col items-center justify-center py-20 text-center gap-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute -inset-10 bg-red-600/20 blur-[80px] rounded-full animate-pulse"></div>
                    <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl">
                        <i className="fas fa-sync-alt text-5xl text-red-600 animate-spin-slow"></i>
                    </div>
                </div>

                <div className="max-w-2xl space-y-6">
                    <h3 className="text-5xl font-black tracking-tighter uppercase">Une nouvelle version est là !</h3>
                    <p className="text-xl text-white/40 leading-relaxed font-medium">
                        La version <span className="text-red-500 font-black">v{version}</span> de RoYout est disponible. 
                        Elle apporte des correctifs de stabilité, une meilleure vitesse de téléchargement et de nouvelles fonctionnalités.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
                    <button 
                        onClick={() => {
                            callApi('open_external_link', 'https://royout.vercel.app/');
                            onClose();
                        }}
                        className="bg-white text-black p-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-2xl hover:scale-105"
                    >
                        Télécharger maintenant
                    </button>
                    <button 
                        onClick={() => {
                            callApi('mark_update_as_ignored');
                            onClose();
                        }}
                        className="bg-white/5 text-white/40 p-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all border border-white/5"
                    >
                        Plus tard (7 jours)
                    </button>
                </div>

                <div className="mt-10 p-8 rounded-[40px] bg-white/[0.02] border border-white/5 text-left w-full max-w-4xl">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-6">Notes de version</h4>
                    <ul className="space-y-4 text-sm text-white/60">
                        <li className="flex gap-4"><i className="fas fa-check text-green-500 mt-1"></i> Migration complète vers l'architecture React & Vite.</li>
                        <li className="flex gap-4"><i className="fas fa-check text-green-500 mt-1"></i> Optimisation des moteurs de recherche YouTube.</li>
                        <li className="flex gap-4"><i className="fas fa-check text-green-500 mt-1"></i> Nouveau design Premium avec animations fluides.</li>
                        <li className="flex gap-4"><i className="fas fa-check text-green-500 mt-1"></i> Support amélioré pour les téléchargements de playlists.</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default UpdateModal;
