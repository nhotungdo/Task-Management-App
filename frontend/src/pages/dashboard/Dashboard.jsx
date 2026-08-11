import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X } from 'lucide-react';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.items || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/tasks', {
        title,
        description,
        status,
        priority
      });
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setPriority('Medium');
      // Refresh list
      fetchTasks();
    } catch (err) {
      console.error(err);
      setError('Đã có lỗi xảy ra khi lưu công việc.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="header" style={{ padding: '24px 24px 0 24px' }}>
        <div>
          <h2>Công việc hôm nay</h2>
          <div className="header-date">Xin chào {user?.name}, Chúc bạn một ngày làm việc hiệu quả!</div>
        </div>
        <button className="add-task-btn" onClick={() => setIsModalOpen(true)}>+ Thêm công việc mới</button>
      </header>

      <div className="task-container" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', alignContent: 'flex-start' }}>
        {tasks.map(task => (
          <div className={`task-card ${task.priority.toLowerCase()}-priority`} key={task.id}>
            <div className="task-header">
              <span className="task-title">{task.title}</span>
            </div>
            <p className="task-desc">{task.description}</p>
            <div className="task-footer">
              <span className={`task-status status-${task.status.toLowerCase().replace(' ', '')}`}>
                {task.status}
              </span>
              <span>Hôm nay</span>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            Chưa có công việc nào. Hãy thêm một công việc mới!
          </div>
        )}
      </div>

      {/* Task Modal (Glassmorphism Popup) */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Tạo công việc mới</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            {error && <div style={{ color: 'red', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600 }}>Tiêu đề công việc</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề..." required style={inputStyle} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600 }}>Mô tả chi tiết</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Nhập mô tả..." rows="3" style={{...inputStyle, resize: 'vertical'}}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>Trạng thái</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                    <option value="To Do">Cần làm (To Do)</option>
                    <option value="In Progress">Đang làm (In Progress)</option>
                    <option value="Done">Hoàn thành (Done)</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>Độ ưu tiên</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
                    <option value="Low">Thấp</option>
                    <option value="Medium">Trung bình</option>
                    <option value="High">Cao</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={isLoading} className="add-task-btn" style={{ padding: '10px 20px', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Đang lưu...' : 'Lưu công việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.2s ease-out'
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '500px',
  padding: '24px',
  background: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
  animation: 'slideUp 0.3s ease-out'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'inherit',
  fontSize: '14px',
};

export default Dashboard;
