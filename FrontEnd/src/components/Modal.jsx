export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
        <button 
          type="button" 
          onClick={onClose} 
          className="btn-link"
          style={{ width: '100%', color: '#666', marginTop: '15px', display: 'block', textAlign: 'center' }}
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
}
