import React, { useState } from 'react';
import Modal from './Modal';
import { useApi } from '../hooks/useApi';

const MenuModal = ({ isOpen, onClose }) => {
    const { isReady, callApi } = useApi();
    const [view, setView] = useState('main');

    const themes = [
        { name: 'Noir Pur', color: '#000000', id: 'black' },
        { name: 'Onyx', color: '#0a0a0a', id: 'onyx' },
        { name: 'Sombre', color: '#0f0f0f', id: 'dark' },
        { name: 'Abysse', color: '#050a14', id: 'abyss' },
        { name: 'Minuit', color: '#0a0c1a', id: 'midnight' },
        { name: 'Espace', color: '#0d0d12', id: 'space' },
        { name: 'Charbon', color: '#161616', id: 'charcoal' },
        { name: 'Anthracite', color: '#1a1a1a', id: 'anthracite' },
        { name: 'Volcan', color: '#1a0d0d', id: 'volcano' },
        { name: 'Prune', color: '#1a0d1a', id: 'plum' },
        { name: 'Océan', color: '#0d1a1a', id: 'ocean' },
        { name: 'Forêt', color: '#0d1a0d', id: 'forest' },
        { name: 'Ardoise', color: '#262626', id: 'slate' },
        { name: 'Nuit', color: '#333333', id: 'night' },
        { name: 'Métal', color: '#4d4d4d', id: 'metal' },
        { name: 'Béton', color: '#808080', id: 'concrete' },
        { name: 'Doux', color: '#f0f0f0', id: 'soft' },
        { name: 'Givre', color: '#e6f0f5', id: 'frost' },
        { name: 'Perle', color: '#f5f5f5', id: 'pearl' },
        { name: 'Blanc', color: '#ffffff', id: 'light' },
    ];

    const menuItems = [
        { id: 'about', icon: 'fa-info-circle', title: 'À propos de RoYout', color: 'bg-blue-500', desc: "L'histoire et la technologie derrière le projet" },
        { id: 'faq', icon: 'fa-question-circle', title: 'FAQ & Aide', color: 'bg-green-500', desc: "Questions fréquentes et assistance technique" },
        { id: 'support', icon: 'fa-heart', title: 'Soutenir le Projet', color: 'bg-red-500', desc: "Faire un don au développeur (Local & Int)" },
        { id: 'updates', icon: 'fa-sync', title: 'Vérifier les Mises à jour', color: 'bg-orange-500', desc: "Lancer la recherche de version sur le serveur", action: () => callApi('check_for_updates') },
        { id: 'website', icon: 'fa-globe', title: 'Site Officiel', color: 'bg-blue-600', desc: "Visiter royout.vercel.app", action: () => callApi('open_external_link', 'https://royout.vercel.app/') },
        { id: 'integration', icon: 'fa-desktop', title: 'Intégration Windows', color: 'bg-indigo-500', desc: "Ajouter RoYout au menu clic droit des dossiers", action: () => callApi('install_context_menu') },
        { id: 'fullscreen', icon: 'fa-expand-arrows-alt', title: 'Mode Immersion', color: 'bg-teal-500', desc: "Basculer la fenêtre en plein écran", action: () => callApi('toggle_fullscreen') },
    ];

    const handleAction = async (item) => {
        if (!isReady) return;
        try {
            if (item.action) {
                await item.action();
                if (item.id !== 'fullscreen' && item.id !== 'integration' && item.id !== 'updates') {
                    onClose();
                }
            } else {
                setView(item.id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'about':
                return (
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                        <button onClick={() => setView('main')} className="flex items-center gap-4 text-white/40 hover:text-white uppercase font-black text-xs tracking-widest transition-all">
                            <i className="fas fa-arrow-left"></i> Retour
                        </button>
                        <div className="p-12 bg-white/[0.02] rounded-[40px] border border-white/5 space-y-8">
                            <h3 className="text-4xl font-black italic tracking-tighter">RoYout v2</h3>
                            <p className="text-xl text-white/60 leading-relaxed">
                                Conçu et développé par <b className="text-white">SERI TAGRO ROY</b>.<br/>
                                Une expérience de téléchargement ultra-rapide et premium.
                            </p>
                        </div>
                    </div>
                );
            case 'faq':
                return (
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                        <button onClick={() => setView('main')} className="flex items-center gap-4 text-white/40 hover:text-white uppercase font-black text-xs tracking-widest transition-all">
                            <i className="fas fa-arrow-left"></i> Retour
                        </button>
                        <div className="space-y-6">
                            <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                                <h4 className="font-bold mb-2 uppercase tracking-widest text-[10px] text-red-500">Aide</h4>
                                <p className="text-sm text-white/40">Collez un lien YouTube ou recherchez une vidéo dans la barre principale pour commencer.</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col gap-16 pb-20 animate-in fade-in duration-500">
                        {/* Actions Principales */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {menuItems.map((item, index) => (
                                <button 
                                    key={index}
                                    onClick={() => handleAction(item)}
                                    className="p-10 rounded-[48px] bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-left group shadow-xl flex items-center gap-8"
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${item.color}/10 flex items-center justify-center text-white/20 group-hover:bg-red-600 group-hover:text-white transition-all`}>
                                        <i className={`fas ${item.icon} text-xl`}></i>
                                    </div>
                                    <div>
                                        <p className="font-black uppercase tracking-[0.2em] text-[11px] text-white/90 group-hover:text-white">{item.title}</p>
                                        <p className="text-[9px] text-white/20 group-hover:text-white/40 mt-1">{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </section>

                        {/* Section Thème */}
                        <section className="space-y-8">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500 text-center">Nuances de Thème</h4>
                            <div className="p-10 rounded-[48px] bg-white/[0.02] border border-white/5 shadow-inner">
                                <div className="grid grid-cols-5 md:grid-cols-10 gap-6">
                                    {themes.map((t, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => callApi('set_theme', t.id)}
                                            className="w-full aspect-square rounded-full border-2 border-white/10 hover:scale-125 hover:border-red-600 transition-all shadow-2xl"
                                            style={{ backgroundColor: t.color }}
                                            title={t.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                        
                        <div className="flex flex-col items-center gap-6">
                            <button onClick={() => callApi('view_logs')} className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 hover:opacity-100 hover:text-orange-500 transition-all">
                                Afficher les Logs Système
                            </button>
                            <div className="text-[8px] font-black uppercase tracking-[0.4em] opacity-10">RoYout Engine v2.0.0 • royout.vercel.app</div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={() => { onClose(); setView('main'); }} 
            title={view === 'main' ? "Configuration" : "Détails"} 
            fullScreen={true}
        >
            {renderContent()}
        </Modal>
    );
};

export default MenuModal;
