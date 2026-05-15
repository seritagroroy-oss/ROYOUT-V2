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
        // Thèmes VSCode
        { name: 'VS Dark', color: '#1e1e1e', id: 'vsdark' },
        { name: 'One Dark', color: '#282c34', id: 'onedark' },
        { name: 'Dracula', color: '#282a36', id: 'dracula' },
        { name: 'Monokai', color: '#272822', id: 'monokai' },
        { name: 'GitHub', color: '#0d1117', id: 'github' },
        { name: 'Nord', color: '#2e3440', id: 'nord' },
        { name: 'Solarized', color: '#002b36', id: 'solarized' },
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
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
                        <button onClick={() => setView('main')} className="flex items-center gap-4 text-white/40 hover:text-white uppercase font-black text-xs tracking-widest transition-all sticky top-0 bg-[#0f0f0f] z-10 py-4">
                            <i className="fas fa-arrow-left"></i> Retour
                        </button>
                        
                        <div className="space-y-12 pb-10">
                            {/* La Genèse */}
                            <section className="p-12 bg-white/[0.02] rounded-[40px] border border-white/5 space-y-6">
                                <h3 className="text-2xl font-black text-red-500 uppercase tracking-widest">La Genèse du Projet</h3>
                                <p className="text-lg text-white/60 leading-relaxed font-medium">
                                    RoYout est né d'un constat simple : récupérer ses propres contenus ou des vidéos libres de droits devrait être une procédure rapide, fluide et sans fioritures. Conçu et développé par <b className="text-white">SERI TAGRO ROY</b>, cet outil est le fruit d'un travail passionné visant à offrir une alternative légère, performante et surtout accessible à tous.
                                </p>
                            </section>

                            {/* Performance & Polyvalence */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-10 bg-white/[0.02] rounded-[40px] border border-white/5 space-y-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">Performance & Polyvalence</h3>
                                    <p className="text-sm text-white/40">Sous le capot, RoYout utilise des algorithmes optimisés pour garantir une flexibilité maximale :</p>
                                    <div className="space-y-4">
                                        {[
                                            { label: "Haute Résolution", desc: "Support complet de la 4K, 1080p et 720p" },
                                            { label: "Formats Vidéo", desc: "Exportation native en MP4 et WebM" },
                                            { label: "Extraction Audio", desc: "Conversion ultra-rapide en MP3 (320 kbps)" },
                                            { label: "Gestion Intelligente", desc: "Fusion automatique des flux audio/vidéo" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{item.label}</p>
                                                    <p className="text-[10px] text-white/30">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-10 bg-white/[0.02] rounded-[40px] border border-white/5 space-y-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">100% Gratuit</h3>
                                    <p className="text-sm text-white/40">L'une des valeurs fondamentales de RoYout est l'accessibilité :</p>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.01]">
                                            <i className="fas fa-check-circle text-green-500"></i>
                                            <span className="text-xs font-bold text-white/60">Pas d'abonnement caché</span>
                                        </div>
                                        <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.01]">
                                            <i className="fas fa-check-circle text-green-500"></i>
                                            <span className="text-xs font-bold text-white/60">Pas de fonctionnalités limitées</span>
                                        </div>
                                        <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.01]">
                                            <i className="fas fa-check-circle text-green-500"></i>
                                            <span className="text-xs font-bold text-white/60">Pas de publicités intrusives</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Engagement Responsable */}
                            <section className="p-12 bg-red-600/5 rounded-[40px] border border-red-600/10 space-y-6">
                                <h3 className="text-2xl font-black text-red-500 uppercase tracking-widest">Engagement Responsable</h3>
                                <p className="text-sm text-white/40 leading-relaxed italic">
                                    Le respect des créateurs est essentiel. RoYout est un outil technique destiné à un usage personnel et privé. Nous encourageons nos utilisateurs à respecter les droits d'auteur et les conditions d'utilisation des plateformes.
                                </p>
                            </section>
                        </div>
                    </div>
                );
            case 'faq':
                return (
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
                        <button onClick={() => setView('main')} className="flex items-center gap-4 text-white/40 hover:text-white uppercase font-black text-xs tracking-widest transition-all sticky top-0 bg-[#0f0f0f] z-10 py-4">
                            <i className="fas fa-arrow-left"></i> Retour
                        </button>
                        
                        <div className="space-y-12 pb-10">
                            <div className="text-center space-y-4">
                                <h3 className="text-3xl font-black text-white">Foire Aux Questions</h3>
                                <p className="text-white/40">Tout ce que vous devez savoir sur RoYout.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { q: "Est-ce que RoYout est vraiment gratuit ?", a: "Oui, RoYout est 100% gratuit. Il n'y a aucun frais d'inscription, ni de fonctionnalités premium cachées. L'outil a été développé par SERI TAGRO ROY dans un esprit de partage et de performance." },
                                    { q: "Quels formats de fichiers sont supportés ?", a: "Vous pouvez télécharger vos vidéos en format MP4 ou WebM. Pour l'audio uniquement, l'application propose une conversion directe en MP3 de haute qualité (320 kbps)." },
                                    { q: "Puis-je télécharger des vidéos en 4K ?", a: "Absolument. Si la vidéo d'origine est disponible en 4K ou en 1080p, RoYout vous permettra de sélectionner ces résolutions. L'application se charge de fusionner automatiquement la vidéo et l'audio pour vous offrir le meilleur rendu possible." },
                                    { q: "L'application fonctionne-t-elle sur Mac et Windows ?", a: "La version actuelle est optimisée pour Windows. Une version pour d'autres systèmes d'exploitation est à l'étude pour permettre à tout le monde de profiter de l'expérience RoYout." },
                                    { q: "Pourquoi utilisez-vous un hébergeur gratuit (Vercel) ?", a: "Nous avons choisi Vercel car l'application est récente et, comme c'est un début, nos moyens ne nous permettent pas encore de louer un serveur dédié. Nous y songeons sérieusement pour le futur. Ce choix technique n'affecte en rien la sécurité de l'outil : RoYout est sain, sans aucun logiciel malveillant." },
                                    { q: "Mon antivirus bloque l'installation ?", a: "Comme RoYout est indépendant et récent, il n'est pas encore 'signé'. Il est possible que Windows SmartScreen affiche une alerte. Vous pouvez ignorer ce message en cliquant sur 'Informations complémentaires' puis 'Exécuter quand même'. L'application est 100% sûre." },
                                    { q: "Est-ce légal d'utiliser RoYout ?", a: "RoYout est un outil technique. Vous êtes responsable de l'usage que vous en faites. Nous vous recommandons de l'utiliser pour télécharger vos propres contenus, des vidéos libres de droits ou pour un usage strictement privé." }
                                ].map((item, i) => (
                                    <div key={i} className="p-8 bg-white/[0.02] rounded-[32px] border border-white/5 hover:border-red-500/20 transition-all group">
                                        <h4 className="font-bold text-white mb-4 flex items-start gap-4">
                                            <span className="w-8 h-8 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center text-xs font-black flex-shrink-0">Q</span>
                                            <span className="group-hover:text-red-500 transition-colors">{item.q}</span>
                                        </h4>
                                        <p className="text-xs text-white/30 leading-relaxed pl-12">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'support':
                return (
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                        <button onClick={() => setView('main')} className="flex items-center gap-4 text-white/40 hover:text-white uppercase font-black text-xs tracking-widest transition-all">
                            <i className="fas fa-arrow-left"></i> Retour
                        </button>
                        <div className="max-w-4xl mx-auto w-full p-16 bg-white/[0.02] rounded-[60px] border border-white/5 text-center space-y-12">
                            <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border border-red-600/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                                <i className="fas fa-heart text-4xl text-red-500 animate-pulse"></i>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black text-white">Soutenir le Projet</h3>
                                <p className="text-white/40 max-w-xl mx-auto leading-relaxed">
                                    RoYout est un projet indépendant et gratuit. Votre soutien aide à maintenir les serveurs et à financer le développement continu de nouvelles fonctionnalités.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-red-500/30 transition-all flex flex-col items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-coffee"></i>
                                    </div>
                                    <div>
                                        <p className="font-black text-white uppercase text-xs tracking-widest">Buy me a coffee</p>
                                        <p className="text-[10px] text-white/20 mt-1">Donation Internationale</p>
                                    </div>
                                </button>
                                <button className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-red-500/30 transition-all flex flex-col items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-mobile-alt"></i>
                                    </div>
                                    <div>
                                        <p className="font-black text-white uppercase text-xs tracking-widest">Orange Money / Moov</p>
                                        <p className="text-[10px] text-white/20 mt-1">Soutien Local (CI)</p>
                                    </div>
                                </button>
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
