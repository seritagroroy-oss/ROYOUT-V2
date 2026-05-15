import React, { useState } from 'react';
import Modal from './Modal';
import { useApi } from '../hooks/useApi';

const MenuModal = ({ isOpen, onClose }) => {
    const { isReady, callApi } = useApi();
    const [view, setView] = useState('main');

    const themes = [
        { name: 'Noir Pur', color: '#000000', id: 'black' },
        { name: 'Onyx', color: '#0a0a0a', id: 'onyx', recommended: true },
        { name: 'Sombre', color: '#0f0f0f', id: 'dark', recommended: true },
        { name: 'Abysse', color: '#050a14', id: 'abyss', recommended: true },
        { name: 'Minuit', color: '#0a0c1a', id: 'midnight', recommended: true },
        { name: 'Espace', color: '#0d0d12', id: 'space', recommended: true },
        { name: 'Charbon', color: '#161616', id: 'charcoal', recommended: true },
        { name: 'Anthracite', color: '#1a1a1a', id: 'anthracite' },
        { name: 'Volcan', color: '#1a0d0d', id: 'volcano', recommended: true },
        { name: 'Prune', color: '#1a0d1a', id: 'plum', recommended: true },
        { name: 'Océan', color: '#0d1a1a', id: 'ocean', recommended: true },
        { name: 'Forêt', color: '#0d1a0d', id: 'forest', recommended: true },
        { name: 'Ardoise', color: '#262626', id: 'slate', recommended: true },
        { name: 'Nuit', color: '#333333', id: 'night', recommended: true },
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
                        <button onClick={() => setView('main')} className="flex items-center gap-4 text-white/40 hover:text-white uppercase font-black text-xs tracking-widest transition-all sticky top-0 z-10 py-4" style={{ backgroundColor: 'var(--theme-bg, #0f0f0f)' }}>
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
                                    { q: "Quels formats de fichiers sont supportés ?", a: "RoYout supporte l'exportation native en MP4 et WebM pour la vidéo. Pour l'audio, vous bénéficiez d'une conversion MP3 haute fidélité (jusqu'à 320 kbps). L'application gère aussi les flux DASH pour une qualité optimale." },
                                    { q: "Gérez-vous les vidéos multi-langues ?", a: "Oui ! RoYout détecte automatiquement les différentes pistes audio (comme sur les chaînes MrBeast). Vous pouvez choisir la langue souhaitée avant de lancer le téléchargement." },
                                    { q: "Puis-je extraire les sous-titres ?", a: "Absolument. Une option vous permet de récupérer les sous-titres originaux ou auto-générés. Ils seront directement intégrés au fichier ou fournis à part selon vos réglages." },
                                    { q: "Est-il possible de découper une vidéo ?", a: "C'est l'une de nos fonctions avancées : vous pouvez définir un début et une fin personnalisés pour ne télécharger que la partie qui vous intéresse, idéal pour les longs podcasts ou lives." },
                                    { q: "Puis-je télécharger des vidéos en 4K ?", a: "Oui, RoYout supporte toutes les résolutions jusqu'à la 4K Ultra HD. L'application fusionne intelligemment les meilleurs flux vidéo et audio disponibles pour garantir une qualité sans perte." },
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
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar pb-20">
                        <button onClick={() => setView('main')} className="flex items-center gap-4 text-white/40 hover:text-white uppercase font-black text-xs tracking-widest transition-all sticky top-0 bg-[#0f0f0f] z-10 py-4">
                            <i className="fas fa-arrow-left"></i> Retour
                        </button>
                        
                        <div className="max-w-4xl mx-auto w-full space-y-12">
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border border-red-600/20">
                                    <i className="fas fa-heart text-3xl text-red-500 animate-pulse"></i>
                                </div>
                                <h3 className="text-4xl font-black text-white">Soutenir le projet RoYout</h3>
                                <p className="text-white/40 leading-relaxed max-w-2xl mx-auto">
                                    RoYout est un projet indépendant développé, maintenu et mis à jour bénévolement par <b className="text-white">SERI TAGRO ROY</b>. L'application restera toujours 100% gratuite et sans publicité.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { icon: "fa-rocket", t: "Serveurs", d: "Améliorer la vitesse des téléchargements." },
                                    { icon: "fa-tools", t: "Maintenance", d: "Adapter le code aux mises à jour des plateformes." },
                                    { icon: "fa-laptop", t: "Évolutions", d: "Investir dans une version mobile ou Mac." }
                                ].map((item, i) => (
                                    <div key={i} className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 text-center space-y-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/20">
                                            <i className={`fas ${item.icon} text-xl`}></i>
                                        </div>
                                        <p className="text-xs font-black text-white uppercase tracking-widest">{item.t}</p>
                                        <p className="text-[10px] text-white/30 leading-relaxed">{item.desc || item.d}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Comment contribuer ?</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* International */}
                                    <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">International</p>
                                        <div className="space-y-4">
                                            <button className="w-full p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between group hover:bg-orange-500 transition-all">
                                                <div className="flex items-center gap-4 text-orange-500 group-hover:text-white">
                                                    <i className="fas fa-coffee"></i>
                                                    <span className="text-xs font-black uppercase tracking-widest">Buy me a coffee</span>
                                                </div>
                                                <i className="fas fa-external-link-alt text-[10px] opacity-40 group-hover:text-white"></i>
                                            </button>
                                            <button className="w-full p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between group hover:bg-blue-500 transition-all">
                                                <div className="flex items-center gap-4 text-blue-500 group-hover:text-white">
                                                    <i className="fab fa-paypal"></i>
                                                    <span className="text-xs font-black uppercase tracking-widest">PayPal</span>
                                                </div>
                                                <i className="fas fa-external-link-alt text-[10px] opacity-40 group-hover:text-white"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Local */}
                                    <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Côte d'Ivoire (Mobile Money)</p>
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { n: "MTN Money", v: "05 54 37 75 07", c: "text-yellow-500" },
                                                { n: "Orange Money", v: "07 67 17 45 41", c: "text-orange-600" },
                                                { n: "Moov Money", v: "01 40 94 59 41", c: "text-blue-400" },
                                                { n: "Wave", v: "05 54 37 75 07", c: "text-blue-600" }
                                            ].map((m, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${m.c}`}>{m.n}</span>
                                                    <span className="text-sm font-black text-white mono">{m.v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-[11px] text-white/20 italic leading-relaxed px-10">
                                "Votre soutien, qu'il soit financier ou simplement un message d'encouragement, est le moteur de ce projet. Merci d'avance à tous ceux qui contribuent à faire grandir RoYout !"
                            </p>
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
                                        <div key={i} className="relative group/theme">
                                            <button 
                                                onClick={() => callApi('set_theme', t.id)}
                                                className={`w-full aspect-square rounded-full border-2 transition-all shadow-2xl hover:scale-125 ${t.recommended ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-white/10 hover:border-red-600'}`}
                                                style={{ backgroundColor: t.color }}
                                                title={t.name}
                                            />
                                            {t.recommended && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-[#0f0f0f] z-10" title="Recommandé"></div>
                                            )}
                                        </div>
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
