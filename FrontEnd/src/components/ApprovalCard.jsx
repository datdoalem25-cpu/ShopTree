import { getImageUrl } from '../services/api';

export default function ApprovalCard({ product, onApprove, onReject }) {
  return (
    <div className="stat-card mb-24" style={{ display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px' }}>
      <div style={{ position: 'relative' }}>
        <img 
          src={getImageUrl(product.productImageUrl)} 
          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
          alt={product.name} 
        />
        <div style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#7c3aed', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>NEW</div>
      </div>
      
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{product.name}</h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
           <span className="admin-badge badge-farmer-green" style={{ fontSize: '11px' }}>{product.farmerId || 'Nông dân'}</span>
           <span style={{ fontSize: '11px', color: '#64748b' }}>Mã: <span style={{ fontWeight: 600 }}>{product.batchSerialNumber}</span></span>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Số lượng: <strong>{product.quantity} {product.unit}</strong> | Giá: <strong>{product.price?.toLocaleString()}đ</strong></p>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button 
          className="btn-ghost-outline" 
          style={{ borderColor: '#fecaca', color: '#ef4444', padding: '10px 16px' }} 
          onClick={onReject}
        >
          Từ chối
        </button>
        <button 
          className="btn-primary-purple" 
          style={{ backgroundColor: '#16a34a', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)', padding: '10px 18px' }} 
          onClick={onApprove}
        >
          Phê duyệt
        </button>
      </div>
    </div>
  );
}
