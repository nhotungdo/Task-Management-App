import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { MessageSquare, Settings as SettingsIcon, Users, CheckSquare } from 'lucide-react';

const MainLayout = () => {
  const [petals, setPetals] = useState([]);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();

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
        <div style={{ padding: '0 20px 20px' }}>
          <select 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)', fontWeight: 600, color: 'var(--text-main)', outline: 'none' }}
            value={activeWorkspace?.workspaceId || ''}
            onChange={(e) => {
              const ws = workspaces.find(w => w.workspaceId === e.target.value);
              if (ws) setActiveWorkspace(ws);
            }}
          >
            {workspaces.map(w => (
              <option key={w.workspaceId} value={w.workspaceId}>{w.name}</option>
            ))}
          </select>
        </div>

        <ul className="menu">
          <Link to="/tasks" style={{textDecoration: 'none'}}>
            <li className={`menu-item ${location.pathname.includes('/tasks') ? 'active' : ''}`}><CheckSquare size={18} style={{marginRight: '12px'}}/> Bảng điều khiển</li>
          </Link>
          <Link to="/chat" style={{textDecoration: 'none'}}>
            <li className={`menu-item ${location.pathname === '/chat' ? 'active' : ''}`}><MessageSquare size={18} style={{marginRight: '12px'}}/> Chat Dự án</li>
          </Link>
          <Link to="/users" style={{textDecoration: 'none'}}>
            <li className={`menu-item ${location.pathname === '/users' ? 'active' : ''}`}><Users size={18} style={{marginRight: '12px'}}/> Thành viên</li>
          </Link>
          <Link to="/settings" style={{textDecoration: 'none'}}>
            <li className={`menu-item ${location.pathname === '/settings' ? 'active' : ''}`}><SettingsIcon size={18} style={{marginRight: '12px'}}/> Cài đặt</li>
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
