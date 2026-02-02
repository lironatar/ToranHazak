
import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { createPortal } from 'react-dom';

const TimePicker24h = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('hours'); // 'hours' | 'minutes'
    const [tempTime, setTempTime] = useState({ hour: '08', minute: '00' });
    const wrapperRef = useRef(null);

    // Initial load
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setTempTime({ hour: h, minute: m });
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHourSelect = (h) => {
        const hourStr = h.toString().padStart(2, '0');
        setTempTime(prev => ({ ...prev, hour: hourStr }));
        setView('minutes'); // Auto advance
    };

    const handleMinuteSelect = (m) => {
        const minuteStr = m.toString().padStart(2, '0');
        const newTime = `${tempTime.hour}:${minuteStr}`;
        setTempTime(prev => ({ ...prev, minute: minuteStr }));
        onChange(newTime); // Commit change
        setIsOpen(false);
        setView('hours'); // Reset for next time
    };

    // Generate Arrays
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...

    return (
        <div className="time-picker-wrapper" ref={wrapperRef}>
            {/* TRIGGER BADGE */}
            <div
                className="time-picker-trigger"
                onClick={() => { setIsOpen(!isOpen); setView('hours'); }}
                style={{
                    fontSize: '1.3rem',
                    fontWeight: '800',
                    color: 'var(--accent-color)',
                    background: 'var(--bg-secondary)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--accent-color)',
                    direction: 'ltr',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '100px',
                    justifyContent: 'center'
                }}
            >
                <Clock size={16} />
                {value || '00:00'}
            </div>

            {/* POPOVER */}
            {isOpen && (
                <div className="time-picker-popover">
                    <div className="time-picker-header">
                        <span
                            className={`time-display-unit ${view === 'hours' ? 'active' : ''}`}
                            onClick={() => setView('hours')}
                        >
                            {tempTime.hour}
                        </span>
                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>:</span>
                        <span
                            className={`time-display-unit ${view === 'minutes' ? 'active' : ''}`}
                            onClick={() => setView('minutes')}
                        >
                            {tempTime.minute}
                        </span>
                    </div>

                    <div className="time-picker-grid">
                        {view === 'hours' ? (
                            hours.map(h => (
                                <div
                                    key={h}
                                    className={`time-cell ${parseInt(tempTime.hour) === h ? 'active' : ''}`}
                                    onClick={() => handleHourSelect(h)}
                                >
                                    {h.toString().padStart(2, '0')}
                                </div>
                            ))
                        ) : (
                            minutes.map(m => (
                                <div
                                    key={m}
                                    className={`time-cell ${parseInt(tempTime.minute) === m ? 'active' : ''}`}
                                    onClick={() => handleMinuteSelect(m)}
                                >
                                    {m.toString().padStart(2, '0')}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimePicker24h;
