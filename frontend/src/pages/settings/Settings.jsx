import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <>
      <header className="header" style={{ padding: '24px 24px 0 24px' }}>
        <div>
          <h2>Cài đặt & Hồ sơ</h2>
          <div className="header-date">Cập nhật thông tin cá nhân và tài khoản</div>
        </div>
      </header>

      <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '900px' }}>
          
          {/* Cập nhật thông tin */}
          <div className="settings-panel" style={panelStyle}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px' }}>Thông tin cá nhân</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                  {user?.avatar || 'U'}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Họ và tên</label>
                <input type="text" defaultValue={user?.name || ''} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Email</label>
                <input type="email" defaultValue={user?.email || ''} style={inputStyle} />
              </div>
              
              <button type="button" className="add-task-btn" style={{ marginTop: '8px' }}>
                Lưu thay đổi
              </button>
            </form>
          </div>

          {/* Đổi mật khẩu */}
          <div className="settings-panel" style={panelStyle}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px' }}>Đổi mật khẩu</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Mật khẩu hiện tại</label>
                <input type="password" placeholder="••••••••" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Mật khẩu mới</label>
                <input type="password" placeholder="••••••••" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Xác nhận mật khẩu mới</label>
                <input type="password" placeholder="••••••••" style={inputStyle} />
              </div>
              
              <button type="button" className="add-task-btn" style={{ marginTop: '8px', background: 'var(--text-main)' }}>
                Cập nhật mật khẩu
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
};

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.85)',
  borderRadius: 'var(--radius-md)',
  padding: '24px',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
};

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'rgba(255,255,255,0.8)',
  fontFamily: 'inherit',
  fontSize: '14px'
};

export default Settings;
