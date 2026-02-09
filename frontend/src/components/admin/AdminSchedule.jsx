import React, { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, User, Trash2 } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import AssignmentDetailsModal from './AssignmentDetailsModal';

const AdminSchedule = ({ activeUnitId, users }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignments, setAssignments] = useState([]);
    const [draggingUser, setDraggingUser] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    // Week Days Calculation
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    useEffect(() => {
        if (activeUnitId) {
            fetchAssignments();
        }
    }, [activeUnitId, currentDate]);

    const fetchAssignments = async () => {
        const start = format(weekDays[0], 'yyyy-MM-dd');
        const end = format(weekDays[6], 'yyyy-MM-dd');
        try {
            const res = await fetch(`/api/assignments?unit_id=${activeUnitId}&start=${start}&end=${end}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAssignments(data);
            } else {
                console.error("Assignments data is not an array:", data);
                setAssignments([]);
            }
        } catch (err) {
            console.error("Failed to fetch assignments", err);
            setAssignments([]);
        }
    };

    const handleDrop = async (e, date) => {
        e.preventDefault();
        if (!draggingUser) return;

        const dateStr = format(date, 'yyyy-MM-dd');

        try {
            await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unit_id: activeUnitId,
                    guest_id: draggingUser.id,
                    date: dateStr
                })
            });
            fetchAssignments();
            setDraggingUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveAssignment = async (date) => {
        if (!window.confirm('האם להסיר את השיבוץ?')) return;
        const dateStr = format(date, 'yyyy-MM-dd');
        try {
            await fetch(`/api/assignments?unit_id=${activeUnitId}&date=${dateStr}`, {
                method: 'DELETE'
            });
            fetchAssignments();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Header / Week Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>לוח שיבוצים</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--glass-bg)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="btn-icon"><ChevronRight /></button>
                    <span style={{ fontSize: '1.1rem', minWidth: '150px', textAlign: 'center' }}>
                        {format(weekDays[0], 'd MMM', { locale: he })} - {format(weekDays[6], 'd MMM', { locale: he })}
                    </span>
                    <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="btn-icon"><ChevronLeft /></button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>

                {/* Users List (Draggable Source) */}
                <div style={{
                    width: '280px',
                    background: 'var(--glass-bg)',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column',
                    overflowY: 'auto'
                }}>
                    <h3 style={{ marginBottom: '16px', opacity: 0.7 }}>סגל ({users.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {users.map(u => (
                            <div
                                key={u.id}
                                draggable
                                onDragStart={(e) => {
                                    setDraggingUser(u);
                                    e.dataTransfer.setData('text/plain', u.id);
                                }}
                                style={{
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'grab',
                                    display: 'flex', alignItems: 'center', gap: '10px'
                                }}
                            >
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                    {u.first_name[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{u.first_name} {u.last_name}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{u.role || 'לוחם'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar Grid */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', height: '100%' }}>
                    {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const assignment = assignments.find(a => a.assignment_date === dateStr);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={dateStr}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, day)}
                                style={{
                                    background: isToday ? 'rgba(59, 130, 246, 0.1)' : 'var(--glass-bg)',
                                    border: isToday ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    display: 'flex', flexDirection: 'column',
                                    gap: '12px',
                                    minHeight: '150px',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    textAlign: 'center',
                                    borderBottom: '1px solid var(--glass-border)',
                                    paddingBottom: '8px',
                                    color: isToday ? 'var(--accent-color)' : 'inherit'
                                }}>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{format(day, 'EEEE', { locale: he })}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{format(day, 'd')}</div>
                                </div>

                                {assignment ? (
                                    <div
                                        onClick={() => setSelectedAssignment(assignment)}
                                        style={{
                                            background: 'linear-gradient(145deg, var(--accent-hover), #047857)', // Darker gradient
                                            color: 'white',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            flex: 1,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{assignment.first_name} {assignment.last_name}</div>

                                        {/* Progress Indicator */}
                                        {(assignment.completed_steps > 0 || assignment.completed_missions > 0) && (
                                            <div style={{
                                                marginTop: '8px',
                                                fontSize: '0.8rem',
                                                background: 'rgba(0,0,0,0.2)',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <span>✅</span>
                                                <span style={{ fontSize: '0.9em' }}>
                                                    {assignment.completed_missions > 0 ? `${assignment.completed_missions} משימות` : `${assignment.completed_steps} צעדים`}
                                                </span>
                                            </div>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveAssignment(day);
                                            }}
                                            style={{
                                                position: 'absolute', top: '4px', left: '4px',
                                                background: 'rgba(0,0,0,0.2)', borderRadius: '50%',
                                                width: '24px', height: '24px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: 'none', cursor: 'pointer', color: 'white',
                                                zIndex: 10
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{
                                        flex: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: 0.3,
                                        fontSize: '0.9rem',
                                        border: '1px dashed var(--glass-border)',
                                        borderRadius: '8px'
                                    }}>
                                        גרירה לכאן
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <AssignmentDetailsModal
                assignment={selectedAssignment}
                onClose={() => setSelectedAssignment(null)}
            />
        </div>
    );
};

export default AdminSchedule;
