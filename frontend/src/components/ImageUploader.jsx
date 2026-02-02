import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Loader, X } from 'lucide-react';

const ImageUploader = ({
    currentImage,
    onUpload,
    onRemove, // Optional
    label = "העלאת תמונה",
    compact = false,
    notify = (msg, type) => alert(msg) // Default to alert
}) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate type
        if (!file.type.startsWith('image/')) {
            notify('נא להעלות קובץ תמונה בלבד', 'error');
            return;
        }

        // Validate size (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            notify('הקובץ גדול מדי (מקסימום 5MB)', 'error');
            return;
        }

        setUploading(true);

        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result;

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64, filename: file.name })
                });

                const data = await res.json();
                if (data.url) {
                    onUpload(data.url);
                    notify('תמונה הועלתה בהצלחה! 🖼️', 'success');
                } else {
                    notify('שגיאה בהעלאה: ' + (data.error || 'Unknown error'), 'error');
                }
            } catch (err) {
                console.error(err);
                notify('שגיאה בהתקשרות לשרת', 'error');
            } finally {
                setUploading(false);
                // Clear input so same file can be selected again
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
            setUploading(false);
            notify('שגיאה בקריאת הקובץ', 'error');
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* PREVIEW or UPLOAD BUTTON */}
            {currentImage ? (
                <div
                    style={{
                        position: 'relative',
                        width: compact ? '40px' : '100%',
                        height: compact ? '40px' : '150px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)'
                    }}
                >
                    <img
                        src={currentImage}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Hover Actions */}
                    <div className="hover-overlay" style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    >
                        <button
                            className="btn-icon"
                            onClick={() => fileInputRef.current?.click()}
                            title="החלף תמונה"
                            style={{ color: 'white', background: 'rgba(255,255,255,0.2)' }}
                        >
                            <Upload size={16} />
                        </button>
                        {onRemove && (
                            <button
                                className="btn-icon"
                                onClick={onRemove}
                                title="מחק תמונה"
                                style={{ color: '#ff4444', background: 'rgba(255,255,255,0.2)' }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed var(--glass-border)',
                        borderRadius: '8px',
                        padding: compact ? '8px' : '16px',
                        display: 'flex',
                        flexDirection: compact ? 'row' : 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: uploading ? 'wait' : 'pointer',
                        color: 'var(--text-secondary)',
                        width: '100%',
                        transition: 'all 0.2s'
                    }}
                >
                    {uploading ? (
                        <Loader size={20} className="spin" />
                    ) : (
                        <>
                            <ImageIcon size={compact ? 16 : 24} />
                            {!compact && <span style={{ fontSize: '0.9rem' }}>{label}</span>}
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default ImageUploader;
