import { useEffect, useState } from 'react';

export const useApi = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkApi = () => {
            if (window.pywebview && window.pywebview.api) {
                setIsReady(true);
            }
        };

        if (window.pywebview && window.pywebview.api) {
            setIsReady(true);
        } else {
            window.addEventListener('pywebviewready', checkApi);
        }

        return () => window.removeEventListener('pywebviewready', checkApi);
    }, []);

    // Proxy pour appeler les méthodes de l'API de manière sécurisée
    const callApi = async (method, ...args) => {
        if (window.pywebview && window.pywebview.api && window.pywebview.api[method]) {
            try {
                return await window.pywebview.api[method](...args);
            } catch (error) {
                console.error(`API Error (${method}):`, error);
                throw error;
            }
        } else {
            console.warn(`API method ${method} not ready or not found.`);
            return null;
        }
    };

    return { isReady, callApi, api: window.pywebview?.api };
};
