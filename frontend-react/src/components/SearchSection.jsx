import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { useApi } from '../hooks/useApi';

const SearchSection = ({ onAnalyze }) => {
    const [query, setQuery] = useState('');
    const { setIsLoading, isLoading } = useAppState();
    const { callApi } = useApi();

    const handleAnalyze = () => {
        if (!query.trim()) return;
        onAnalyze(query);
    };

    return (
        <div className="w-full max-w-5xl mx-auto py-12">
            <div className={`
                flex gap-3 p-2 bg-white/[0.03] border border-white/5 rounded-[32px] backdrop-blur-xl 
                transition-all duration-500 group focus-within:border-red-500/30 focus-within:bg-white/[0.05]
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
            `}>
                <div className="flex-1 relative flex items-center">
                    <i className={`fas fa-link absolute left-6 transition-colors ${query ? 'text-red-500' : 'text-white/20'}`}></i>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="Collez un lien YouTube ou faites une recherche..." 
                        className="w-full bg-transparent p-5 pl-14 rounded-2xl outline-none text-lg placeholder:text-white/10 font-medium tracking-tight text-white"
                    />
                </div>
                
                <button 
                    onClick={handleAnalyze}
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
        </div>
    );
};

export default SearchSection;
