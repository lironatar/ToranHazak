import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const MobileTimePicker = ({ value, onChange, label, placeholder = "--:--" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // For custom success toast

    const parseTime = (timeStr) => {
        if (!timeStr) {
            const now = new Date();
            const h = now.getHours();
            const m = Math.round(now.getMinutes() / 5) * 5;
            return { h, m: m === 60 ? 0 : m };
        }
        const [h, m] = timeStr.split(':').map(Number);
        return { h: h || 0, m: m || 0 };
    };

    // State
    const [selectedHour, setSelectedHour] = useState(0);
    const [selectedMinute, setSelectedMinute] = useState(0);

    // Data
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    const hoursRef = useRef(null);
    const minutesRef = useRef(null);
    const isScrollingRef = useRef(false); // To prevent jitter if needed

    // Initialize on open
    useEffect(() => {
        if (isOpen) {
            const initial = parseTime(value);
            setSelectedHour(initial.h);
            setSelectedMinute(initial.m);
            setShowSuccess(false);

            // Scroll to initial position
            setTimeout(() => {
                if (hoursRef.current) {
                    hoursRef.current.scrollTo({ top: initial.h * 40, behavior: 'auto' });
                }
                if (minutesRef.current) {
                    const mIndex = minutes.indexOf(initial.m);
                    if (mIndex !== -1) {
                        minutesRef.current.scrollTo({ top: mIndex * 40, behavior: 'auto' });
                    }
                }
            }, 50);
        }
    }, [isOpen]);

    // Scroll Handlers (The core "Zero-Click" logic)
    const handleScroll = (e, type) => {
        if (!e.target) return;
        const scrollTop = e.target.scrollTop;
        const itemHeight = 40;
        const index = Math.round(scrollTop / itemHeight);

        if (type === 'hour') {
            const h = hours[index];
            if (h !== undefined && h !== selectedHour) {
                setSelectedHour(h);
            }
        } else {
            const m = minutes[index];
            if (m !== undefined && m !== selectedMinute) {
                setSelectedMinute(m);
            }
        }
    };

    const handleSave = () => {
        // Show success state first
        setShowSuccess(true);

        // Wait then close
        setTimeout(() => {
            const hStr = selectedHour.toString().padStart(2, '0');
            const mStr = selectedMinute.toString().padStart(2, '0');
            onChange(`${hStr}:${mStr}`);
            setIsOpen(false);
            setShowSuccess(false);
        }, 1200);
    };

    // Helper for smooth scroll click (still useful to center tapping)
    const scrollToItem = (ref, index) => {
        if (ref.current) {
            ref.current.scrollTo({ top: index * 40, behavior: 'smooth' });
        }
    };

    return (
        <>
            <div className="mobile-time-picker">
                {label && <label className="time-picker-label">{label}</label>}
                <button
                    onClick={() => setIsOpen(true)}
                    className="time-picker-trigger touch-target"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: value ? '#fff' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s',
                        minWidth: '85px',
                        justifyContent: 'center'
                    }}
                >
                    <Clock size={14} style={{ opacity: 0.7 }} />
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', letterSpacing: '0.5px' }}>
                        {value || placeholder}
                    </span>
                </button>
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !showSuccess && setIsOpen(false)} // Prevent close during success
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(3px)',
                                    zIndex: 9998
                                }}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                style={{
                                    position: 'fixed',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    marginTop: '-150px',
                                    marginLeft: '-140px',
                                    width: '280px',
                                    background: '#1e2332',
                                    borderRadius: '24px',
                                    zIndex: 9999,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                    overflow: 'hidden'
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {showSuccess ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                height: '300px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '16px',
                                                color: '#fff'
                                            }}
                                        >
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%',
                                                background: 'var(--accent-color)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
                                            }}>
                                                <Check size={32} color="#fff" strokeWidth={3} />
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <h3 style={{ margin: 0, fontSize: '18px' }}>נשמר בהצלחה!</h3>
                                                <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px', fontFamily: 'monospace' }}>
                                                    {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <div style={{
                                                padding: '16px',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                textAlign: 'center',
                                                background: 'rgba(255,255,255,0.02)'
                                            }}>
                                                <h3 style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
                                                    בחר שעה
                                                </h3>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'stretch',
                                                height: '160px',
                                                position: 'relative',
                                                background: '#151825',
                                                direction: 'ltr'
                                            }}>
                                                {/* Highlight Bar */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '60px',
                                                    left: '16px',
                                                    right: '16px',
                                                    height: '40px',
                                                    background: 'rgba(255,255,255,0.08)',
                                                    borderRadius: '8px',
                                                    pointerEvents: 'none',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }} />

                                                {/* Helper Labels */}
                                                <div style={{ position: 'absolute', top: '8px', left: '25%', fontSize: '10px', color: 'rgba(255,255,255,0.3)', transform: 'translate(-50%)' }}>HH</div>
                                                <div style={{ position: 'absolute', top: '8px', right: '25%', fontSize: '10px', color: 'rgba(255,255,255,0.3)', transform: 'translate(50%)' }}>MM</div>

                                                {/* HOURS */}
                                                <div
                                                    ref={hoursRef}
                                                    className="picker-column-scroll"
                                                    onScroll={(e) => handleScroll(e, 'hour')}
                                                    style={{
                                                        flex: 1,
                                                        overflowY: 'scroll',
                                                        scrollSnapType: 'y mandatory',
                                                        paddingBlock: '60px',
                                                        scrollbarWidth: 'none',
                                                        msOverflowStyle: 'none',
                                                        zIndex: 1
                                                    }}
                                                >
                                                    {hours.map(h => {
                                                        const isSelected = selectedHour === h;
                                                        return (
                                                            <div
                                                                key={h}
                                                                onClick={() => scrollToItem(hoursRef, h)}
                                                                style={{
                                                                    height: '40px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    scrollSnapAlign: 'center',
                                                                    fontSize: isSelected ? '24px' : '16px',
                                                                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)',
                                                                    fontWeight: isSelected ? 'bold' : 'normal',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.1s', // Faster for scroll feel
                                                                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                                                }}
                                                            >
                                                                {h.toString().padStart(2, '0')}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', fontSize: '20px', color: 'rgba(255,255,255,0.3)', paddingBottom: '4px', zIndex: 1 }}>:</div>

                                                {/* MINUTES */}
                                                <div
                                                    ref={minutesRef}
                                                    className="picker-column-scroll"
                                                    onScroll={(e) => handleScroll(e, 'minute')}
                                                    style={{
                                                        flex: 1,
                                                        overflowY: 'scroll',
                                                        scrollSnapType: 'y mandatory',
                                                        paddingBlock: '60px',
                                                        scrollbarWidth: 'none',
                                                        zIndex: 1
                                                    }}
                                                >
                                                    {minutes.map(m => {
                                                        const isSelected = selectedMinute === m;
                                                        return (
                                                            <div
                                                                key={m}
                                                                onClick={() => scrollToItem(minutesRef, minutes.indexOf(m))}
                                                                style={{
                                                                    height: '40px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    scrollSnapAlign: 'center',
                                                                    fontSize: isSelected ? '24px' : '16px',
                                                                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)',
                                                                    fontWeight: isSelected ? 'bold' : 'normal',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.1s',
                                                                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                                                }}
                                                            >
                                                                {m.toString().padStart(2, '0')}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '16px',
                                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                                background: 'rgba(255,255,255,0.02)'
                                            }}>
                                                <button
                                                    onClick={() => setIsOpen(false)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <X size={16} /> ביטול
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        background: 'var(--accent-color)',
                                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <Check size={16} /> שמור זמן
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default MobileTimePicker;
