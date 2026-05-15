import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { isReady, callApi } = useApi();
    const [history, setHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [queueCount, setQueueCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [fontSize, setFontSize] = useState(100);
    const [settings, setSettings] = useState(null);

    const [currentFolder, setCurrentFolder] = useState('');

    // Charger les données initiales dès que l'API est prête
    useEffect(() => {
        if (isReady) {
            loadInitialData();
            loadSettings();
            
            // Écouter les mises à jour depuis le backend
            window.updateQueueUI = (count) => setQueueCount(count);
        }
    }, [isReady]);

    // Appliquer le zoom sur le document
    useEffect(() => {
        document.documentElement.style.fontSize = `${(fontSize / 100) * 16}px`;
        if (isReady) callApi('update_setting', 'font_size', fontSize);
    }, [fontSize, isReady]);

    const loadInitialData = async () => {
        try {
            const hist = await callApi('get_history');
            const favs = await callApi('get_favorites');
            if (hist) setHistory(hist);
            if (favs) setFavorites(favs);
        } catch (err) {
            console.error("Failed to load initial data", err);
        }
    };

    const loadSettings = async () => {
        try {
            const s = await callApi('get_all_settings');
            if (s) {
                setSettings(s);
                if (s.font_size) setFontSize(s.font_size);
                if (s.theme && window.applyTheme) window.applyTheme(s.theme);
                if (s.download_folder) setCurrentFolder(s.download_folder);
            }
        } catch (err) {
            console.error("Failed to load settings", err);
        }
    };

    const handleSelectFolder = async () => {
        const folder = await callApi('select_folder');
        if (folder) setCurrentFolder(folder);
    };

    const toggleFavorite = async (video) => {
        const res = await callApi('toggle_favorite', video);
        if (res && res.status === 'success') {
            setFavorites(res.favorites);
            return res.action;
        }
    };

    const changeFontSize = (delta) => {
        setFontSize(prev => Math.min(Math.max(prev + (delta * 10), 70), 150));
    };

    const resetFontSize = () => setFontSize(100);

    return (
        <AppContext.Provider value={{
            history, 
            favorites, 
            queueCount, 
            isLoading, 
            setIsLoading,
            fontSize,
            changeFontSize,
            resetFontSize,
            toggleFavorite,
            loadInitialData,
            isReady,
            currentFolder,
            handleSelectFolder
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppState = () => useContext(AppContext);
