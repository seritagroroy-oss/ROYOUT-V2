import React from 'react';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const Navbar = ({ onOpenHistory, onOpenFavorites, onOpenQueue, onOpenMenu, immersionMode }) => {
    const { queueCount, changeFontSize, resetFontSize, currentFolder, handleSelectFolder } = useAppState();
    const { callApi } = useApi();

    return (
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-card)] backdrop-blur-xl sticky top-0 z-[300] drag-area">
            {/* Gauche: Menu & Branding */}
            <div className="flex items-center gap-4 no-drag">
                {/* Bouton Menu */}
                <button 
                    onClick={onOpenMenu}
                    className="w-9 h-9 rounded-xl bg-[var(--theme-card-hover)] flex items-center justify-center text-[var(--theme-text-dim)] hover:text-red-500 hover:bg-red-600/10 transition-all border border-[var(--theme-border)] hover:border-red-500/30 group"
                >
                    <i className="fas fa-bars text-xs group-hover:scale-110 transition-transform"></i>
                </button>

                {/* Contrôles de taille de police */}
                <div className="flex items-center gap-1 bg-[var(--theme-card)] p-1 rounded-xl border border-[var(--theme-border)]">
                    <button 
                        onClick={() => changeFontSize(-1)}
                        className="w-7 h-7 rounded-lg hover:bg-[var(--theme-card-hover)] text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] transition-all flex items-center justify-center" 
                        title="Réduire"
                    >
                        <i className="fas fa-minus text-[8px]"></i>
                    </button>
                    <button 
                        onClick={resetFontSize}
                        className="w-7 h-7 rounded-lg hover:bg-[var(--theme-card-hover)] text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] transition-all flex items-center justify-center" 
                        title="Réinitialiser"
                    >
                        <i className="fas fa-undo text-[8px]"></i>
                    </button>
                    <button 
                        onClick={() => changeFontSize(1)}
                        className="w-7 h-7 rounded-lg hover:bg-[var(--theme-card-hover)] text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] transition-all flex items-center justify-center" 
                        title="Agrandir"
                    >
                        <i className="fas fa-plus text-[8px]"></i>
                    </button>
                </div>

                {/* Logo avec effet spin */}
                <div className="relative ml-2">
                    <div className="absolute -inset-1 rounded-full border border-red-500/30 animate-spin-slow opacity-50"></div>
                    <div className="relative w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
                        <img src="/logo.png" alt="R" className="w-5 h-5 rounded-full" />
                    </div>
                </div>

                <h1 className="text-sm font-black tracking-tighter flex items-center gap-0.5">
                    <span className="text-[var(--theme-text)]">Ro</span>
                    <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Yout</span>
                </h1>
            </div>

            {/* Centre: Outils */}
            <div className="flex-1 flex justify-center gap-8 no-drag">
                <button 
                    onClick={onOpenHistory}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-dim)] hover:text-red-500 transition-all group"
                >
                    <i className="fas fa-history text-xs group-hover:rotate-[-45deg] transition-transform"></i>
                    Historique
                </button>

                <button 
                    onClick={onOpenFavorites}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-dim)] hover:text-red-500 transition-all group"
                >
                    <i className="fas fa-heart text-xs group-hover:scale-110 transition-transform"></i>
                    Favoris
                </button>

                <div 
                    onClick={onOpenQueue}
                    className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-dim)] hover:text-red-500 transition-all cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-card-hover)] flex items-center justify-center border border-[var(--theme-border)] group-hover:border-red-500/30 transition-all">
                        <i className="fas fa-list-ol text-xs"></i>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] opacity-50 font-bold">File d'attente</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[var(--theme-text)]">{queueCount}</span>
                            {queueCount > 0 && <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Droite: Signature & Controls */}
            <div className="flex items-center gap-6 no-drag">
                {/* Sélecteur de dossier rapide */}
                <div 
                    onClick={handleSelectFolder}
                    className="hidden lg:flex items-center gap-3 px-4 py-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl hover:bg-[var(--theme-card-hover)] transition-all cursor-pointer group"
                    title={currentFolder}
                >
                    <i className="fas fa-folder text-yellow-500 text-[10px]"></i>
                    <div className="flex flex-col">
                        <span className="text-[7px] text-[var(--theme-text-dim)] font-black uppercase tracking-widest">Destination</span>
                        <span className="text-[9px] font-bold text-[var(--theme-text)] opacity-60 truncate max-w-[120px]">
                            {currentFolder ? currentFolder.split('/').pop() || currentFolder.split('\\').pop() : 'Sélectionner...'}
                        </span>
                    </div>
                </div>

                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hidden xl:block">
                    ROY INDUSTRIE
                </span>

                <button 
                    onClick={() => {
                        const newState = !window.isMini;
                        window.isMini = newState;
                        callApi('toggle_mini_mode', newState);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all"
                    title="Mini Mode"
                >
                    <i className="fas fa-compress-alt"></i>
                </button>
                {immersionMode && (
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => callApi('minimize_window')}
                            className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                        >
                            <i className="fas fa-minus text-[10px]"></i>
                        </button>
                        <button 
                            onClick={() => callApi('close_window')}
                            className="w-9 h-9 rounded-lg hover:bg-red-600 flex items-center justify-center text-white/40 hover:text-white transition-all"
                        >
                            <i className="fas fa-times text-[10px]"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;
