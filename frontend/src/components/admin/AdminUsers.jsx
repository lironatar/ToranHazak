import React from 'react';
import { Trash } from 'lucide-react';

const AdminUsers = ({ users, deleteUser }) => {
    return (
        <div className="admin-content">
            <h2>רשימת חיילים</h2>
            <p style={{ opacity: 0.7, marginBottom: '24px' }}>צפה ונהל את כל החיילים במערכת.</p>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--glass-border)' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'right' }}>שם</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>פלוגה</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>סטטוס</th>
                            <th style={{ padding: '16px', textAlign: 'center' }}>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, i) => (
                            <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                                <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {user.first_name[0]}{user.last_name[0]}
                                    </div>
                                    {user.first_name} {user.last_name}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {user.unit_title ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {user.unit_image && <img src={user.unit_image} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />}
                                            <span>{user.unit_title}</span>
                                        </div>
                                    ) : (
                                        <span style={{ opacity: 0.5 }}>-</span>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        background: user.status === 'approved' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        color: user.status === 'approved' ? '#2ecc71' : 'inherit'
                                    }}>
                                        {user.status === 'approved' ? 'פעיל' : user.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="btn-icon"
                                        style={{ color: 'tomato' }}
                                        title="מחק משתמש"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>אין משתמשים במערכת</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
