import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const MissionCarousel = ({ images, onImageClick }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const options = {
            root: container,
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = parseInt(entry.target.dataset.index, 10);
                    if (!isNaN(index)) {
                        setActiveIndex(index);
                    }
                }
            });
        }, options);

        const slides = container.querySelectorAll('[data-carousel-slide]');
        slides.forEach(slide => observer.observe(slide));

        return () => observer.disconnect();
    }, [images]);

    if (!images || images.length === 0) return null;

    return (
        <div style={{ marginBottom: '20px' }}>
            {/* Carousel */}
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    height: '220px', // Fixed height for consistency
                }}
            >
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        data-carousel-slide="true"
                        data-index={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            onImageClick && onImageClick(img);
                        }}
                        style={{
                            minWidth: '100%',
                            scrollSnapAlign: 'center',
                            position: 'relative',
                            cursor: 'zoom-in'
                        }}
                    >
                        <img
                            src={img}
                            alt={`Slide ${idx}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        {/* Zoom Hint */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', padding: '6px', backdropFilter: 'blur(2px)' }}>
                            <Search size={14} color="white" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Dots */}
            {images.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                    {images.map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: idx === activeIndex ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MissionCarousel;
