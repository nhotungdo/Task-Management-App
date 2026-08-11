import React from 'react';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Đặt lại mật khẩu</h2>
      
      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Mật khẩu mới</label>
          <input type="password" placeholder="••••••••" required style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Xác nhận mật khẩu</label>
          <input type="password" placeholder="••••••••" required style={inputStyle} />
        </div>

        <button type="submit" className="add-task-btn" style={{ width: '100%', marginTop: '8px' }}>
          Lưu mật khẩu mới
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Quay lại đăng nhập</Link>
      </p>
    </div>
  );
};

const inputStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'rgba(255,255,255,0.8)',
  fontFamily: 'inherit',
  fontSize: '15px'
};

export default ResetPassword;
