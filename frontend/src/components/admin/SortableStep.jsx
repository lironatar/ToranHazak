import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';

const SortableStep = ({ step, index, handleQuickUpdate, deleteItem }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={step}
            id={step.id}
            dragListener={false}
            dragControls={controls}
            whileDrag={{
                scale: 1.05,
                backgroundColor: 'rgba(255,255,255,0.08)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                zIndex: 10
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                padding: '10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}
        >
            {/* Drag Handle */}
            <div
                onPointerDown={(e) => controls.start(e)}
                style={{ cursor: 'grab', touchAction: 'none', padding: '4px', opacity: 0.5 }}
            >
                <GripVertical size={16} />
            </div>

            {/* Step Number */}
            <div style={{
                minWidth: '20px',
                fontSize: '0.75rem',
                opacity: 0.5,
                textAlign: 'center'
            }}>
                {index + 1}
            </div>

            {/* Editable Title */}
            <input
                defaultValue={step.title}
                onBlur={(e) => {
                    if (e.target.value !== step.title) {
                        handleQuickUpdate('step', step.id, 'title', e.target.value);
                    }
                }}
                className="input-modern"
                style={{
                    flex: 1,
                    fontSize: '0.9rem',
                    background: 'transparent',
                    border: '1px solid transparent',
                    padding: '4px 8px'
                }}
                placeholder="שם התת-משימה"
            />

            {/* Editable Duration */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 8px',
                borderRadius: '6px',
                minWidth: '70px'
            }}>
                <input
                    type="number"
                    defaultValue={step.duration}
                    onBlur={(e) => {
                        const newVal = parseInt(e.target.value);
                        if (newVal !== step.duration) {
                            handleQuickUpdate('step', step.id, 'duration', newVal);
                        }
                    }}
                    className="input-modern"
                    style={{
                        width: '35px',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        padding: '0'
                    }}
                />
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>דק'</span>
            </div>

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    deleteItem('step', step.id, step.title);
                }}
                className="btn-icon"
                style={{ color: 'var(--accent-danger)', opacity: 0.7, padding: '4px' }}
                title="מחק"
            >
                <Trash2 size={16} />
            </button>
        </Reorder.Item>
    );
};

export default SortableStep;
