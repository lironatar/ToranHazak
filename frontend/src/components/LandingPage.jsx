import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleEnter = async (e) => {
        e.preventDefault();
        if (firstName && lastName && !loading) {
            setLoading(true);
            try {
                // Register/Login with backend
                const res = await fetch('/api/guests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ first_name: firstName, last_name: lastName })
                });

                if (!res.ok) throw new Error('Login failed');

                const data = await res.json();

                // Save to localStorage
                localStorage.setItem('guest_name', JSON.stringify({ firstName, lastName }));
                if (data.id) {
                    localStorage.setItem('guest_id', data.id);
                }

                navigate('/scheduler', { replace: true });
            } catch (err) {
                console.error("Login error:", err);
                alert("שגיאה בהתחברות, אנא נסה שוב");
                setLoading(false);
            }
        }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ textAlign: 'center' }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <img src="/Logo-Bright.png" alt="Toren Hazak Logo" className="theme-logo" style={{ maxHeight: '120px', marginBottom: '16px' }} />
                </div>

                <form onSubmit={handleEnter}>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', top: '15px', right: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="שם פרטי"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            style={{ paddingRight: '40px' }}
                            required
                            disabled={loading}
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="שם משפחה"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
                        {loading ? 'מתחבר...' : 'כניסה'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.6 }}>
                    מנהל מערכת? <span onClick={() => navigate('/admin/login')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>לחץ כאן</span>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
