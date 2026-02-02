import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'כן, מחק', cancelText = 'ביטול', isDestructive = false }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px'
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)'
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        style={{
                            position: 'relative',
                            background: '#1a1a2e',
                            width: '100%', maxWidth: '400px',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: isDestructive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px auto',
                            color: isDestructive ? 'var(--accent-danger)' : 'var(--accent-color)'
                        }}>
                            <AlertTriangle size={32} />
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>
                            {title}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', lineHeight: '1.5' }}>
                            {message}
                        </p>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.95rem'
                                }}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => { onConfirm(); onClose(); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: isDestructive ? 'var(--accent-danger)' : 'var(--accent-color)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.95rem',
                                    boxShadow: isDestructive ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
