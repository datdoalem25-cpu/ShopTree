const statConfig = {
  total: { bg: '#e5f2eb', color: '#208753', link: 'Xem chi tiết →' },
  pending: { bg: '#ffedd5', color: '#ea580c', link: null },
  approved: { bg: '#dcfce7', color: '#16a34a', link: null },
  rejected: { bg: '#fee2e2', color: '#dc2626', link: null }
};

export default function StatCard({ title, value, icon, statType = 'total', onLinkClick }) {
  const config = statConfig[statType] || statConfig.total;

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      border: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minWidth: '200px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: config.bg,
        color: config.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px'
      }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{title}</div>
        <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>{value}</div>
      </div>
      {config.link && (
        <button
          type="button"
          onClick={onLinkClick}
          style={{
            fontSize: '13px',
            color: '#208753',
            fontWeight: '600',
            marginTop: 'auto',
            textDecoration: 'none',
            background: 'transparent',
            border: 'none',
            cursor: onLinkClick ? 'pointer' : 'default',
            padding: 0,
            textAlign: 'left'
          }}
        >
          {config.link}
        </button>
      )}
    </div>
  );
}
