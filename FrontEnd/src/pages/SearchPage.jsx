import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import './SearchPage.css';

export default function SearchPage() {
  const [batchId, setBatchId] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (id) => {
    const newHistory = [id, ...history.filter(item => item !== id)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const searchProduct = () => {
    if (batchId.trim()) {
      saveToHistory(batchId.trim());
      navigate(`/track?id=${batchId.trim()}`);
    }
  };

  const handleDecodedResult = useCallback((decodedText) => {
    try {
      const url = new URL(decodedText);
      const id = url.searchParams.get('id');
      const searchId = id || decodedText;
      saveToHistory(searchId);
      navigate(`/track?id=${searchId}`);
    } catch {
      saveToHistory(decodedText);
      navigate(`/track?id=${decodedText}`);
    }
  }, [navigate, history]);

  const openCamera = useCallback(() => {
    setCameraOpen(true);
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(
        (decodedText) => {
          closeCamera();
          setScanError('');
          handleDecodedResult(decodedText);
        },
        () => { /* Scanning... */ }
      );
    }, 100);
  }, [handleDecodedResult]);

  const closeCamera = () => {
    setCameraOpen(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  const scanFromFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      setScanError('Tệp PDF chưa hỗ trợ quét trực tiếp. Vui lòng tải QR dạng ảnh PNG/JPG rồi quét lại.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setScanError('Chỉ hỗ trợ quét từ tệp ảnh QR (PNG/JPG/JPEG/WebP).');
      return;
    }

    const fileScanner = new Html5Qrcode('qr-file-reader');
    try {
      const decodedText = await fileScanner.scanFile(file, true);
      setScanError('');
      handleDecodedResult(decodedText);
    } catch {
      setScanError('Không đọc được mã QR từ ảnh này. Hãy thử ảnh rõ nét hơn.');
    } finally {
      await fileScanner.clear().catch(() => {});
    }
  };

  return (
    <div className="search-page">
      <div className="search-header-container">
        <div className="logo-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="7" height="7" x="7" y="7"/><rect width="1" height="1" x="15" y="7"/><rect width="1" height="1" x="7" y="15"/><rect width="1" height="1" x="15" y="15"/>
          </svg>
        </div>
        <h1 className="search-title">Truy xuất nguồn gốc</h1>
        <p className="search-subtitle">
          Nhập mã định danh sản phẩm hoặc quét mã QR trên bao bì để xem thông tin chi tiết.
        </p>
      </div>

      <div className="search-card">
        <div className="search-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Nhập mã sản phẩm (VD: 2)"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchProduct()}
          />
        </div>

        <div className="search-actions">
          <button className="btn-search primary" onClick={searchProduct}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            Tra cứu thông tin
          </button>
          <button className="btn-search outline" onClick={openCamera}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            Quét mã QR
          </button>
        </div>

        {scanError && <p className="scan-error-text">{scanError}</p>}

        <div className="divider"></div>

        <div className="history-section">
          <h4 className="history-title">Mã đã quét gần đây</h4>
          <div className="history-tags">
            {history.length > 0 ? (
              history.map((id, idx) => (
                <button key={idx} className="history-pill" onClick={() => navigate(`/track?id=${id}`)}>
                  ID: {id}
                </button>
              ))
            ) : (
              <span style={{ fontSize: '13px', color: '#94a3b8 italic' }}>Chưa có mã nào</span>
            )}
          </div>
        </div>
      </div>

      <Link to="/" className="return-login">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Quay lại trang đăng nhập
      </Link>

      {cameraOpen && (
        <div className="camera-overlay">
          <div className="camera-modal">
            <h3 className="camera-modal-title">Đưa mã QR vào khung hình</h3>
            <div id="qr-reader" className="qr-box"></div>
            <button
              className="btn-upload-modal"
              onClick={() => {
                closeCamera();
                setTimeout(() => fileInputRef.current?.click(), 120);
              }}
            >
              Tải ảnh QR từ máy
            </button>
            <button className="btn-close-modal" onClick={closeCamera}>Đóng Camera</button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,.pdf"
        style={{ display: 'none' }}
        onChange={scanFromFile}
      />

      <div id="qr-file-reader" style={{ display: 'none' }}></div>
    </div>
  );
}
