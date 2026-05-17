import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const SearchSection = ({ onAnalyze, onSearch }) => {
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('mixed');
    const { setIsLoading, isLoading } = useAppState();
    const { callApi } = useApi();

    const filters = [
        { id: 'mixed', label: 'Tout', icon: 'fa-search' },
        { id: 'video', label: 'Vidéos', icon: 'fa-video' },
        { id: 'playlist', label: 'Playlists', icon: 'fa-list-ul' },
        { id: 'short', label: '- 4m', icon: 'fa-clock' },
        { id: 'long', label: '+ 20m', icon: 'fa-hourglass-half' },
    ];

    const handleAction = () => {
        if (!query.trim()) return;
        const q = query.trim();
        if (q.includes('youtube.com/') || q.includes('youtu.be/')) {
            onAnalyze(q);
        } else {
            onSearch(q, activeFilter);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto py-12 space-y-6">
            <div className={`
                search-bar-container flex gap-3 p-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[32px] backdrop-blur-xl 
                transition-all duration-500 group focus-within:border-red-500/30 focus-within:bg-[var(--theme-card-hover)]
                shadow-[var(--theme-shadow)]
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
            `}>
                <div className="flex-1 relative flex items-center">
                    <i className={`fas fa-link absolute left-6 transition-colors ${query ? 'text-red-500' : 'opacity-20'}`}></i>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && handleAction()}
                        placeholder="Collez un lien YouTube ou faites une recherche..." 
                        className="w-full bg-transparent p-5 pl-14 rounded-2xl outline-none text-lg placeholder:opacity-10 font-medium tracking-tight text-[var(--theme-text)]"
                    />
                </div>
                
                <button 
                    onClick={handleAction}
                    disabled={isLoading}
                    className="
                        bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 
                        px-10 py-4 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] 
                        transition-all active:scale-95 shadow-xl shadow-red-900/20 
                        flex items-center gap-3 min-w-[180px] justify-center
                    "
                >
                    {isLoading ? (
                        <>
                            <span>Analyse...</span>
                            <i className="fas fa-circle-notch fa-spin text-[10px]"></i>
                        </>
                    ) : (
                        <>
                            <span>Analyser</span>
                            <i className="fas fa-arrow-right text-[10px]"></i>
                        </>
                    )}
                </button>
            </div>

            <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${activeFilter === f.id 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 scale-105' 
                                : 'bg-[var(--theme-card)] text-[var(--theme-text-dim)] border border-[var(--theme-border)] hover:bg-[var(--theme-card-hover)]'}
                        `}
                    >
                        <i className={`fas ${f.icon} text-[9px]`}></i>
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchSection;
