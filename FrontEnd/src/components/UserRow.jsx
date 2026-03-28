export default function UserRow({ user }) {
  const date = new Date(user.createdAt).toISOString().split('T')[0];
  const safeName = user.fullName || 'Người dùng';
  const firstLetter = safeName.charAt(0).toUpperCase();

  // Avatar colors based on name first letters or roles
  const getAvatarColor = () => {
    if (user.role === 'ADMIN') return { bg: '#f3e8ff', text: '#9333ea' };
    if (firstLetter < 'M') return { bg: '#dcfce7', text: '#16a34a' };
    return { bg: '#e0e7ff', text: '#4f46e5' };
  };

  const { bg, text } = getAvatarColor();

  return (
    <tr>
      <td>
        <div className="user-cell">
          <div 
            className="avatar-badge" 
            style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '14px', backgroundColor: bg, color: text }}
          >
            {firstLetter}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{safeName}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user.email}</div>
          </div>
        </div>
      </td>
      <td>
        <span className={`admin-badge ${user.role === 'ADMIN' ? 'badge-admin-purple' : 'badge-farmer-green'}`}>
          {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'USER' ? 'Người dùng' : 'Nông dân'}
        </span>
      </td>
      <td>
        <span className="admin-badge badge-active-green">Đang hoạt động</span>
      </td>
      <td className="text-xs" style={{ color: '#64748b' }}>{date}</td>
      <td style={{ textAlign: 'center' }}>
        <div className="action-dot" style={{ color: '#cbd5e1', cursor: 'pointer' }}>⋮</div>
      </td>
    </tr>
  );
}
