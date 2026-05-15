import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, fullScreen = false, maxWidth = 'max-w-4xl' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    {!fullScreen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md cursor-pointer"
                        />
                    )}
                    
                    {/* Modal Content */}
                    <motion.div 
                        initial={fullScreen ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={fullScreen ? { opacity: 0, y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={`fixed inset-0 z-[101] flex items-center justify-center ${fullScreen ? 'p-0' : 'p-6'} pointer-events-none`}
                    >
                        <div 
                            className={`
                                w-full flex flex-col pointer-events-auto overflow-hidden bg-[#0f0f0f]
                                ${fullScreen ? 'h-full' : `${maxWidth} max-h-[85vh] border border-white/10 rounded-[40px] shadow-2xl`}
                            `}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className={`px-8 py-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02] ${fullScreen ? 'pt-16' : ''}`}>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white flex items-center gap-4">
                                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                        {title}
                                    </h2>
                                    {fullScreen && <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-black mt-2">Expérience RoYout Premium</p>}
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-red-600 hover:scale-110 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-xl"
                                >
                                    <i className="fas fa-times text-lg"></i>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                                <div className={`${fullScreen ? 'max-w-6xl mx-auto w-full' : ''}`}>
                                    {children}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
