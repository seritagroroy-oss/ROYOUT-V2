import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
                    style={{ backgroundColor: 'var(--theme-bg, #0f0f0f)' }}
                >
                    <div className="relative mb-12">
                        {/* Glow background */}
                        <motion.div 
                            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -inset-20 bg-red-600/20 blur-[100px] rounded-full"
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, type: "spring" }}
                            className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white/10 shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden"
                        >
                            <img src="/logo.png" alt="R" className="w-20 h-20 rounded-full" />
                        </motion.div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-black tracking-tighter text-white flex items-center gap-1"
                        >
                            <span>Ro</span><span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Yout</span>
                        </motion.h2>
                        
                        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 w-full rounded-full"
                            />
                        </div>
                        <p className="text-[9px] text-white/30 uppercase tracking-[0.5em] font-black mt-2">Chargement de l'expérience</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
