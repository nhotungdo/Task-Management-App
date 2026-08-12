import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { X, CheckCircle, Circle, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Assign Users state
  const [users, setUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchTasks = async () => {
    if (!activeWorkspace) return;
    try {
      const response = await api.get(`/tasks?workspaceId=${activeWorkspace.workspaceId}`);
      setTasks(response.data.items || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      fetchTasks();
    }
  }, [activeWorkspace]);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'Done' ? 'To Do' : 'Done';
    try {
      await api.put(`/tasks/${task.id || task.taskId}`, { status: newStatus });
      toast.success(`Đã đánh dấu task là ${newStatus}`);
      fetchTasks();
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
      console.error(err);
    }
  };

  const handleAssignUser = async (userId) => {
    try {
      await api.post(`/tasks/${selectedTaskId}/assignments`, { userId });
      toast.success('Đã mời thành viên thành công!');
      setAssignModalOpen(false);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Thành viên này đã có trong task.');
      } else {
        toast.error('Lỗi khi mời thành viên.');
      }
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/tasks', {
        title,
        description,
        status,
        priority,
        workspaceId: activeWorkspace.workspaceId
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
          <h2>{activeWorkspace ? activeWorkspace.name : 'Công việc hôm nay'}</h2>
          <div className="header-date">Xin chào {user?.name}, Chúc bạn một ngày làm việc hiệu quả!</div>
        </div>
        <button className="add-task-btn" onClick={() => setIsModalOpen(true)}>+ Thêm công việc mới</button>
      </header>

      <div className="task-container" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', alignContent: 'flex-start' }}>
        {tasks.map(task => (
          <div className={`task-card ${task.priority.toLowerCase()}-priority`} key={task.id || task.taskId}>
            <div className="task-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <button 
                onClick={() => handleToggleStatus(task)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px' }}
                title="Đánh dấu hoàn thành"
              >
                {task.status === 'Done' ? (
                  <CheckCircle size={20} color="var(--primary)" />
                ) : (
                  <Circle size={20} color="var(--text-muted)" />
                )}
              </button>
              <span className="task-title" style={{ flex: 1, textDecoration: task.status === 'Done' ? 'line-through' : 'none', color: task.status === 'Done' ? 'var(--text-muted)' : 'inherit' }}>
                {task.title}
              </span>
              <button 
                onClick={() => { setSelectedTaskId(task.id || task.taskId); setAssignModalOpen(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px', borderRadius: '50%' }}
                className="hover-bg-primary"
                title="Mời thành viên"
              >
                <UserPlus size={18} />
              </button>
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
      {/* Assign User Modal */}
      {assignModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Mời thành viên</h3>
              <button onClick={() => setAssignModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {users.map(u => (
                <div key={u.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.fullName || u.email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <button 
                    onClick={() => handleAssignUser(u.userId)}
                    style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    Mời
                  </button>
                </div>
              ))}
              {users.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy người dùng nào.</div>
              )}
            </div>
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
