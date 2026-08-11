import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import api from '../../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess('Đăng ký thành công! Đang chuyển hướng đến đăng nhập...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>Tạo tài khoản mới</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Tham gia cộng đồng TaskSakura ngay hôm nay</p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ padding: '12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label style={labelStyle}>Họ và tên</label>
          <div className="input-wrapper" style={inputWrapperStyle}>
            <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
            <input type="text" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
          </div>
        </div>

        <div className="input-group">
          <label style={labelStyle}>Địa chỉ Email</label>
          <div className="input-wrapper" style={inputWrapperStyle}>
            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
            <input type="email" placeholder="Nhập email của bạn" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          </div>
        </div>

        <div className="input-group">
          <label style={labelStyle}>Mật khẩu</label>
          <div className="input-wrapper" style={inputWrapperStyle}>
            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
            <input type="password" placeholder="Tối thiểu 8 ký tự" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          </div>
        </div>

        <button type="submit" className="add-task-btn" disabled={isLoading} style={{...submitBtnStyle, opacity: isLoading ? 0.7 : 1}}>
          <UserPlus size={18} /> {isLoading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>HOẶC ĐĂNG KÝ VỚI</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="social-btn" style={socialBtnStyle}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="Google" />
          Google
        </button>
        <button className="social-btn" style={socialBtnStyle}>
          <img src="https://www.svgrepo.com/show/512317/github-142.svg" width="20" alt="GitHub" />
          GitHub
        </button>
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '15px' }}>
        Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập ngay</Link>
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .input-wrapper input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.2) !important;
          outline: none;
        }
        .social-btn:hover {
          background: rgba(255, 255, 255, 0.9) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: 600,
  marginBottom: '8px',
  display: 'block',
  color: 'var(--text-main)'
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px 14px 44px',
  borderRadius: '12px',
  border: '1px solid var(--glass-border)',
  background: 'rgba(255, 255, 255, 0.6)',
  fontFamily: 'inherit',
  fontSize: '15px',
  color: 'var(--text-main)',
  transition: 'all 0.2s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
};

const submitBtnStyle = {
  width: '100%', 
  marginTop: '8px', 
  padding: '14px', 
  fontSize: '16px', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  gap: '8px',
  borderRadius: '12px',
  cursor: 'pointer'
};

const socialBtnStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  background: 'rgba(255, 255, 255, 0.5)',
  border: '1px solid var(--glass-border)',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-main)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export default Register;
