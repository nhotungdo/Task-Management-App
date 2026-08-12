import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, Bell, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <CheckCircle size={32} color="#D32F2F" />,
      title: "Quản lý công việc",
      description: "Tạo, theo dõi và hoàn thành nhiệm vụ dễ dàng với giao diện trực quan và sắc nét."
    },
    {
      icon: <Users size={32} color="#D32F2F" />,
      title: "Phân công linh hoạt",
      description: "Giao việc cho đồng đội chỉ với vài cú click. Dễ dàng theo dõi tiến độ của từng thành viên."
    },
    {
      icon: <Bell size={32} color="#D32F2F" />,
      title: "Cập nhật tức thời",
      description: "Sử dụng công nghệ SignalR, bạn sẽ nhận được thông báo ngay lập tức khi có biến động."
    },
    {
      icon: <Zap size={32} color="#D32F2F" />,
      title: "Hiệu năng tối đa",
      description: "Tối ưu hóa để chạy mượt mà trên mọi thiết bị, giúp bạn làm việc mọi lúc mọi nơi."
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100vw' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.2)', position: 'fixed', width: '100%', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #D32F2F, #F48FB1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px', boxShadow: '0 4px 12px rgba(211,47,47,0.3)' }}>T</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>TaskSakura</h1>
        </div>
        <div>
          {isAuthenticated ? (
            <Link to="/tasks" style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '24px', textDecoration: 'none', fontWeight: 600, display: 'inline-block', boxShadow: '0 4px 15px rgba(211,47,47,0.4)', transition: 'transform 0.2s' }} className="hover-scale">
              Vào Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link to="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} className="hover-color">Đăng nhập</Link>
              <Link to="/register" style={{ padding: '10px 24px', background: 'white', color: 'var(--primary)', borderRadius: '24px', textDecoration: 'none', fontWeight: 700, border: '2px solid var(--primary)', transition: 'all 0.2s' }} className="hover-bg-primary">
                Đăng ký miễn phí
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '160px 24px 80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '64px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, marginBottom: '24px', maxWidth: '800px', animation: 'fadeInUp 0.8s ease-out' }}>
          Quản lý công việc với phong cách <span style={{ color: 'var(--primary)', position: 'relative' }}>Hoa Anh Đào<span style={{ position: 'absolute', bottom: '-4px', left: 0, width: '100%', height: '8px', background: 'var(--accent)', opacity: 0.3, borderRadius: '4px' }}></span></span>
        </h2>
        <p style={{ fontSize: '20px', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.6, animation: 'fadeInUp 1s ease-out' }}>
          TaskSakura kết hợp sự thanh lịch của phong cách thiết kế Nhật Bản với công cụ quản lý dự án mạnh mẽ, mang lại hiệu suất tối đa cho đội nhóm của bạn.
        </p>
        
        <div style={{ animation: 'fadeInUp 1.2s ease-out' }}>
          {isAuthenticated ? (
             <Link to="/tasks" style={{ padding: '16px 36px', background: 'linear-gradient(135deg, #D32F2F, #b71c1c)', color: 'white', borderRadius: '30px', textDecoration: 'none', fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 24px rgba(211,47,47,0.4)', transition: 'all 0.3s' }} className="btn-glow">
              Tiếp tục công việc <ArrowRight size={20} />
            </Link>
          ) : (
            <Link to="/register" style={{ padding: '16px 36px', background: 'linear-gradient(135deg, #D32F2F, #b71c1c)', color: 'white', borderRadius: '30px', textDecoration: 'none', fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 24px rgba(211,47,47,0.4)', transition: 'all 0.3s' }} className="btn-glow">
              Bắt đầu miễn phí <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 24px', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
          {features.map((feature, index) => (
            <div key={index} className="glass-panel hover-lift" style={{ padding: '32px', textAlign: 'center', animation: `fadeInUp ${1.2 + index * 0.2}s ease-out` }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(211,47,47,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.3)' }}>
        <p>&copy; 2026 TaskSakura. Được thiết kế với 🌸 từ Antigravity.</p>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        .hover-color:hover {
          color: var(--primary) !important;
        }
        .hover-bg-primary:hover {
          background: var(--primary) !important;
          color: white !important;
        }
        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(211,47,47,0.5) !important;
        }
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-10px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default Landing;
