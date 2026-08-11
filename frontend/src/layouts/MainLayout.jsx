import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const [petals, setPetals] = useState([]);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const newPetals = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: (Math.random() * 5 + 5) + 's',
      animationDelay: (Math.random() * 5) + 's',
      width: (Math.random() * 10 + 10) + 'px',
      height: (Math.random() * 10 + 10) + 'px',
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="app-container">
      {/* Cherry Blossom Animation */}
      <div className="petals-container">
        {petals.map(petal => (
          <div 
            key={petal.id} 
            className="petal"
            style={{
              left: petal.left,
              animationDuration: petal.animationDuration,
              animationDelay: petal.animationDelay,
              width: petal.width,
              height: petal.height
            }}
          />
        ))}
      </div>

      {/* Sidebar - Glassmorphism */}
      <aside className="sidebar glass-panel">
        <div className="brand">
          <span className="torii-icon">⛩️</span>
          <h1>TaskSakura</h1>
        </div>
        
        <ul className="menu">
          <Link to="/" style={{textDecoration: 'none'}}>
            <li className={`menu-item ${location.pathname === '/' ? 'active' : ''}`}>📋 Bảng điều khiển</li>
          </Link>
          <Link to="/users" style={{textDecoration: 'none'}}>
            <li className={`menu-item ${location.pathname === '/users' ? 'active' : ''}`}>👥 Thành viên</li>
          </Link>
          <Link to="/settings" style={{textDecoration: 'none'}}>
            <li className={`menu-item ${location.pathname === '/settings' ? 'active' : ''}`}>⚙️ Cài đặt</li>
          </Link>
          <div style={{ flex: 1 }}></div>
          <button onClick={logout} style={{background: 'none', border: 'none', width: '100%', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'}}>
            <li className="menu-item" style={{ color: 'var(--primary)', fontWeight: 600 }}>🚪 Đăng xuất</li>
          </button>
        </ul>

        {user && (
          <div className="user-profile">
            <div className="avatar">{user.avatar}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main-content glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
