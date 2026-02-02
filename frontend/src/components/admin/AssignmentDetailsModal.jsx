import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const AssignmentDetailsModal = ({ assignment, onClose }) => {
    const [content, setContent] = useState([]);
    const [progress, setProgress] = useState({ steps: [], missions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (assignment) {
            fetchData();
        }
    }, [assignment]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Content Tree for the user's profile
            // Use active_profile_id if available, fallback to profile_id
            const profileId = assignment.active_profile_id || assignment.profile_id;

            if (profileId) {
                const contentRes = await fetch(`/api/profiles/${profileId}/content`);
                const contentData = await contentRes.json();
                setContent(Array.isArray(contentData) ? contentData : []);
            }

            // 2. Fetch Progress for that specific date
            const date = assignment.assignment_date;
            const progressRes = await fetch(`/api/progress/${assignment.guest_id}?date=${date}`);
            const progressData = await progressRes.json();
            setProgress(progressData); // { steps: [id, ...], missions: [id, ...] }

        } catch (err) {
            console.error("Failed to fetch details", err);
        } finally {
            setLoading(false);
        }
    };

    if (!assignment) return null;

    // Calculate Stats
    const allStepIds = content.reduce((acc, level) =>
        [...acc, ...level.missions.flatMap(m => m.steps.map(s => s.id))], []);

    const totalSteps = allStepIds.length;

    // Filter progress to only include steps that actually exist in the current content
    const completedStepsCount = progress.steps.filter(id => allStepIds.includes(id)).length;

    const progressPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px'
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: '#1a1a2e', // Match theme dark bg
                        width: '100%', maxWidth: '500px',
                        maxHeight: '90vh',
                        borderRadius: '24px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                                    {assignment.first_name} {assignment.last_name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7, fontSize: '0.9rem' }}>
                                    <Clock size={14} />
                                    <span>{format(new Date(assignment.assignment_date), 'eeee, d MMMM', { locale: he })}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <X color="white" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${progressPercentage}%`,
                                height: '100%',
                                background: 'var(--accent-color)',
                                transition: 'width 0.5s ease-out'
                            }}></div>
                        </div>
                        <div style={{ textAlign: 'left', marginTop: '4px', fontSize: '0.8rem', opacity: 0.8 }}>
                            {progressPercentage}% הושלם ({completedStepsCount}/{totalSteps})
                        </div>
                    </div>

                    {/* Content List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>טוען נתונים...</div>
                        ) : content.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>אין משימות ליום זה</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {content.map(level => (
                                    <div key={level.id}>
                                        <h4 style={{
                                            fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-color)',
                                            marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px'
                                        }}>
                                            {level.title}
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {level.missions.map(mission => (
                                                <div key={mission.id} style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    border: progress.missions.includes(mission.id) ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                                                }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                        {mission.title}
                                                        {progress.missions.includes(mission.id) && <CheckCircle size={16} color="var(--success-color)" />}
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {mission.steps.map(step => {
                                                            const isCompleted = progress.steps.includes(step.id);
                                                            return (
                                                                <div key={step.id} style={{
                                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                                    padding: '8px', borderRadius: '8px',
                                                                    background: isCompleted ? 'rgba(57, 255, 20, 0.05)' : 'transparent',
                                                                    opacity: isCompleted ? 1 : 0.6
                                                                }}>
                                                                    {isCompleted ? (
                                                                        <CheckCircle size={18} color="var(--success-color)" fill="rgba(57, 255, 20, 0.1)" />
                                                                    ) : (
                                                                        <Circle size={18} color="rgba(255,255,255,0.3)" />
                                                                    )}
                                                                    <span style={{
                                                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                                                        fontSize: '0.9rem'
                                                                    }}>
                                                                        {step.title}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AssignmentDetailsModal;
