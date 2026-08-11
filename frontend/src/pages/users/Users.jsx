import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách thành viên', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <>
      <header className="header" style={{ padding: '24px 24px 0 24px' }}>
        <div>
          <h2>Quản lý Thành viên</h2>
          <div className="header-date">Danh sách những người tham gia dự án</div>
        </div>
        <button className="add-task-btn">+ Mời thành viên</button>
      </header>

      <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Đang tải danh sách...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {users.map(user => (
              <div key={user.id} className="user-card" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'var(--accent)', color: 'white', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold'
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '18px' }}>{user.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>{user.role}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4CAF50' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></span>
                        Thành viên
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                Chưa có thành viên nào.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.85)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  transition: 'all 0.3s ease',
};

export default Users;
