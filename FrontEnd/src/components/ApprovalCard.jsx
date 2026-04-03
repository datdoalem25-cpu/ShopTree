import { getImageUrl } from '../services/api';

export default function ApprovalCard({ product, onApprove, onReject }) {
  const isEditRequest = product.pendingUpdate != null;
  const pu = product.pendingUpdate || {};

  // Helper: hiện giá trị cũ → mới nếu có thay đổi
  const DiffRow = ({ label, oldVal, newVal }) => {
    const changed = newVal !== undefined && String(newVal) !== String(oldVal);
    return (
      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
        <span style={{ color: '#94a3b8' }}>{label}: </span>
        {changed ? (
          <>
            <span style={{ textDecoration: 'line-through', color: '#ef4444', marginRight: '6px' }}>{oldVal}</span>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>{newVal}</span>
          </>
        ) : (
          <strong>{oldVal}</strong>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px',
      background: 'white', borderRadius: '16px', marginBottom: '16px',
      border: isEditRequest ? '2px solid #f59e0b' : '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Ảnh sản phẩm */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={getImageUrl(product.productImageUrl)}
          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
          alt={product.name}
        />
        <div style={{
          position: 'absolute', top: '-8px', right: '-8px',
          backgroundColor: isEditRequest ? '#f59e0b' : '#7c3aed',
          color: 'white', fontSize: '10px', padding: '2px 7px',
          borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap',
        }}>
          {isEditRequest ? '✏️ SỬA' : 'MỚI'}
        </div>
      </div>

      {/* Thông tin */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
            {isEditRequest && pu.name && pu.name !== product.name ? (
              <>
                <span style={{ textDecoration: 'line-through', color: '#ef4444', marginRight: '6px' }}>{product.name}</span>
                <span style={{ color: '#16a34a' }}>{pu.name}</span>
              </>
            ) : product.name}
          </h4>
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600',
            backgroundColor: isEditRequest ? '#fef3c7' : '#f1f5f9',
            color: isEditRequest ? '#92400e' : '#475569',
          }}>
            {isEditRequest ? 'Yêu cầu sửa đổi' : 'Lô hàng mới'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
            backgroundColor: '#dcfce7', color: '#166534', fontWeight: '600',
          }}>{product.farmerId || 'Nông dân'}</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Mã: <strong>{product.batchSerialNumber}</strong>
          </span>
        </div>

        {/* Hiện diff nếu là edit request, hoặc thông tin bình thường nếu là lô mới */}
        {isEditRequest ? (
          <div style={{
            backgroundColor: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '10px', padding: '10px 14px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
              📋 Thay đổi đề nghị (gạch đỏ = cũ, xanh = mới):
            </div>
            <DiffRow label="Số lượng"
              oldVal={`${product.quantity} ${product.unit}`}
              newVal={pu.quantity !== undefined || pu.unit !== undefined
                ? `${pu.quantity ?? product.quantity} ${pu.unit ?? product.unit}`
                : undefined}
            />
            <DiffRow label="Đơn giá"
              oldVal={`${product.price?.toLocaleString()}đ`}
              newVal={pu.price !== undefined ? `${Number(pu.price).toLocaleString()}đ` : undefined}
            />
            {pu.description !== undefined && (
              <DiffRow label="Mô tả"
                oldVal={product.description || '(trống)'}
                newVal={pu.description || '(trống)'}
              />
            )}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Số lượng: <strong>{product.quantity} {product.unit}</strong>
            {' | '}
            Giá: <strong>{product.price?.toLocaleString()}đ</strong>
          </p>
        )}
      </div>

      {/* Nút hành động */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch', justifyContent: 'center', flexShrink: 0 }}>
        <button
          style={{
            padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            backgroundColor: '#16a34a', color: 'white', fontWeight: '700', fontSize: '13px',
            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
          }}
          onClick={onApprove}
        >
          {isEditRequest ? '✓ Duyệt thay đổi' : '✓ Phê duyệt'}
        </button>
        <button
          style={{
            padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
            backgroundColor: 'white', color: '#ef4444', fontWeight: '700', fontSize: '13px',
            border: '1px solid #fecaca',
          }}
          onClick={onReject}
        >
          {isEditRequest ? '✗ Từ chối thay đổi' : '✗ Từ chối'}
        </button>
      </div>
    </div>
  );
}
