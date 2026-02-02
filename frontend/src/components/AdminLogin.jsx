import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = () => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            console.log('Login response status:', res.status);
            const data = await res.json();

            if (data.success) {
                // In a real app, store token in Context or secure storage
                localStorage.setItem('admin_token', data.token);
                navigate('/admin');
            } else {
                setError('פרטי התחברות שגויים');
            }
        } catch (err) {
            setError('שגיאת תקשורת');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Lock size={32} color="var(--accent-color)" />
                    <h2 style={{ marginTop: '12px' }}>כניסת מנהל</h2>
                </div>

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="מזהה מנהל"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="סיסמה"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && <p style={{ color: 'red', marginBottom: '12px', fontSize: '0.9rem' }}>{error}</p>}

                    <button type="submit" className="btn-primary">
                        התחבר
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
