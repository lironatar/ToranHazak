import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import MissionCarousel from './MissionCarousel';

const ScheduleTimeline = ({
    schedule,
    completedSteps,
    completedMissions = new Set(), // Default to empty set
    toggleCompletion,
    toggleMissionCompletion,
    onImageClick,
    readOnly = false
}) => {
    const [expandedIds, setExpandedIds] = useState(new Set());

    const toggleExpand = (id) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    if (!Array.isArray(schedule) || schedule.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                <p style={{ fontSize: '1.2rem' }}>אין משימות להצגה.</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', paddingRight: '12px' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', right: '0', top: '24px', bottom: '0', width: '2px', background: 'var(--glass-border)', borderRadius: '2px' }}></div>

            {schedule.map((level) => (
                <div key={level.id} style={{ position: 'relative', paddingRight: '20px', marginBottom: '48px' }}>

                    {/* Timeline Dot */}
                    <div style={{
                        position: 'absolute',
                        right: '-19px',
                        top: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'var(--accent-color)',
                            boxShadow: '0 0 0 4px var(--bg-primary), 0 0 10px var(--accent-color)',
                            zIndex: 2
                        }}></div>
                    </div>

                    {/* Level Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', marginTop: '-4px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>{level.title}</h3>
                        </div>

                        {level.target_time && (
                            <span style={{
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                                background: 'var(--bg-secondary)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                {level.target_time}
                            </span>
                        )}
                    </div>

                    {/* MISSIONS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {level.missions && level.missions.map(mission => {
                            const isExpanded = expandedIds.has(mission.id);

                            // Determine Completion Status
                            let isMissionCompleted = false;
                            if (mission.steps && mission.steps.length > 0) {
                                isMissionCompleted = mission.steps.every(s => completedSteps.has(s.id));
                            } else {
                                isMissionCompleted = completedMissions.has(mission.id);
                            }

                            return (
                                <div
                                    key={mission.id}
                                    className="glass-card"
                                    onClick={() => toggleExpand(mission.id)}
                                    style={{
                                        cursor: 'pointer',
                                        border: '1px solid var(--glass-border)',
                                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                        background: isExpanded ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '16px',
                                        boxShadow: isExpanded ? '0 10px 30px -10px rgba(0,0,0,0.3)' : 'var(--card-shadow)',
                                        transform: isExpanded ? 'scale(1.01)' : 'scale(1)'
                                    }}
                                >
                                    {/* MISSION HEADER GRID */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'min-content 1fr min-content',
                                        gap: '16px',
                                        alignItems: 'start'
                                    }}>
                                        {/* Checkbox */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div
                                                onClick={(e) => !readOnly && toggleMissionCompletion(e, mission)}
                                                style={{
                                                    cursor: readOnly ? 'default' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    height: '28px',
                                                    marginTop: '2px'
                                                }}
                                            >
                                                {isMissionCompleted ?
                                                    <CheckCircle size={28} color="var(--success-color)" fill="rgba(46, 204, 113, 0.2)" /> :
                                                    <Circle size={28} color="var(--text-secondary)" opacity={0.3} />
                                                }
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0', lineHeight: '32px' }}>
                                                {mission.title}
                                            </h3>
                                            <p style={{ fontSize: '1rem', opacity: 0.7, lineHeight: 1.5, margin: 0, paddingLeft: '12px' }}>
                                                {mission.description}
                                            </p>
                                            {mission.duration && (
                                                <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)', marginTop: '4px', fontWeight: 500 }}>
                                                    {mission.duration} דק'
                                                </span>
                                            )}
                                        </div>

                                        {/* Chevron */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingTop: '4px' }}>
                                            <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center', height: '24px' }}>
                                                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* EXPANDED CONTENT */}
                                    {isExpanded && (
                                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>

                                            {/* Images */}
                                            {(() => {
                                                let images = [];
                                                try {
                                                    if (mission.images) {
                                                        const parsed = typeof mission.images === 'string' ? JSON.parse(mission.images) : mission.images;
                                                        images = Array.isArray(parsed) ? parsed : [];
                                                    } else if (mission.image_url) {
                                                        images = [mission.image_url];
                                                    }
                                                } catch (e) {
                                                    if (mission.image_url) images = [mission.image_url];
                                                }
                                                images = images.filter(img => typeof img === 'string' && img.length > 0);

                                                if (images.length > 0) {
                                                    return <MissionCarousel images={images} onImageClick={onImageClick} />;
                                                }
                                                return null;
                                            })()}

                                            {/* Steps */}
                                            {mission.steps && mission.steps.map(step => {
                                                const isStepCompleted = completedSteps.has(step.id);
                                                return (
                                                    <div key={step.id}
                                                        onClick={(e) => !readOnly && toggleCompletion(e, step.id)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '12px 16px',
                                                            marginBottom: '8px',
                                                            background: isStepCompleted ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255,255,255,0.03)',
                                                            borderRadius: '12px',
                                                            cursor: readOnly ? 'default' : 'pointer',
                                                            border: '1px solid transparent',
                                                            borderColor: isStepCompleted ? 'var(--success-color)' : 'transparent',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ marginLeft: '16px' }}>
                                                            {isStepCompleted ?
                                                                <CheckCircle size={22} color="var(--success-color)" fill="rgba(46, 204, 113, 0.2)" /> :
                                                                <Circle size={22} color="var(--text-secondary)" opacity={0.3} />
                                                            }
                                                        </div>
                                                        <div style={{ textDecoration: isStepCompleted ? 'line-through' : 'none', flex: 1, opacity: isStepCompleted ? 0.6 : 1 }}>
                                                            <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{step.title}</span>
                                                            {step.subtitle && <span style={{ fontSize: '0.9rem', opacity: 0.7, marginRight: '8px' }}> - {step.subtitle}</span>}
                                                        </div>
                                                        {step.duration && <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{step.duration} דק'</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduleTimeline;
