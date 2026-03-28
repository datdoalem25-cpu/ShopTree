import { getImageUrl } from '../services/api';

export default function ProductCard({ product, onEdit, onDelete, onPrintQR }) {
  const { _id, status, productImageUrl, name, quantity, unit, price, qrCodeImageUrl } = product;

  let badgeClass = 'badge-pending';
  let statusLabel = 'Chờ duyệt';
  if (status === 'APPROVED') { badgeClass = 'badge-approved'; statusLabel = 'Đã duyệt'; }
  if (status === 'REJECTED') { badgeClass = 'badge-rejected'; statusLabel = 'Bị từ chối'; }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s',
    }} className="product-card-hover">
      <div style={{ position: 'relative', height: '200px', width: '100%' }}>
        <img 
          src={getImageUrl(productImageUrl)} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
          <span className={`badge ${badgeClass}`}>{statusLabel}</span>
        </div>
      </div>
      
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{name}</h4>
          <span style={{ 
            padding: '4px 10px', borderRadius: '6px', 
            backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '600' 
          }}>
            #{_id ? _id.slice(-6).toUpperCase() : 'BATCH'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Số lượng</div>
            <div style={{ fontWeight: '600', color: '#334155' }}>{quantity} {unit}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Đơn giá</div>
            <div style={{ fontWeight: '600', color: '#334155' }}>{price?.toLocaleString()}đ</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <button 
            onClick={() => onEdit(product)}
            style={{
              flex: 1, padding: '10px 0', background: 'white',
              border: '1px solid #e2e8f0', borderRadius: '10px', color: '#475569',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Sửa
          </button>
          <button 
             onClick={() => onDelete(_id)}
             style={{
              flex: 1, padding: '10px 0', background: 'white',
              border: '1px solid #fee2e2', borderRadius: '10px', color: '#ef4444',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}
          >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Xóa
          </button>
          {status === 'APPROVED' && (
            <button 
              onClick={() => onPrintQR(product)}
              title="In mã QR"
              style={{
                width: '42px', height: '42px', background: '#124c2f',
                border: 'none', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
