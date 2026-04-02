import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { passAPI, checkLogAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdQrCodeScanner, MdCheckCircle, MdLogout, MdSearch, MdCameraAlt, MdStopCircle } from 'react-icons/md';
import toast from 'react-hot-toast';

const ScanQR = () => {
  const [qrInput, setQrInput] = useState('');
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);

  const startCamera = async () => {
    setCameraError('');
    try {
      const html5QrCode = new Html5Qrcode('qr-scanner-box');
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          stopCamera();
          setQrInput(decodedText);
          lookupPass(decodedText);
          toast.success('QR code scanned!');
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      if (err.toString().includes('ermission')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.toString().includes('NotFound')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not start camera. Use manual input below instead.');
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => { return () => { stopCamera(); }; }, []);

  const lookupPass = async (code) => {
    const passCode = (code || qrInput).trim();
    if (!passCode) return;
    setLoading(true);
    setPassData(null);
    try {
      const res = await passAPI.getByQR(passCode);
      setPassData(res.data.pass);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pass not found');
    } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await checkLogAPI.checkin({ passId: passData._id });
      setPassData(p => ({ ...p, status: 'checked-in' }));
      toast.success(`${passData.visitor?.name} checked in!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await checkLogAPI.checkout({ passId: passData._id });
      setPassData(p => ({ ...p, status: 'checked-out' }));
      toast.success(`${passData.visitor?.name} checked out!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Check-out failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Scan QR Code</h1>
          <p>Open the camera to scan a visitor pass, or enter the code manually.</p>
        </div>

        <div style={{ maxWidth: 560 }}>

          {/* Camera card */}
          <div className="card animate-fadeUp" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15 }}>Camera Scanner</h3>
              {!cameraActive
                ? <button className="btn btn-primary" onClick={startCamera}><MdCameraAlt /> Open Camera</button>
                : <button className="btn btn-danger" onClick={stopCamera}><MdStopCircle /> Stop</button>
              }
            </div>

            <div style={{
              width: '100%', minHeight: 200,
              background: 'var(--surface-2)',
              border: `2px ${cameraActive ? 'solid var(--accent)' : 'dashed var(--border)'}`,
              borderRadius: 10, overflow: 'hidden', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div id="qr-scanner-box" style={{ width: '100%' }} />
              {!cameraActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <MdQrCodeScanner style={{ fontSize: 52, color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {cameraError || 'Click "Open Camera" to start scanning'}
                  </span>
                </div>
              )}
            </div>

            {cameraError && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
                ⚠️ {cameraError}
              </div>
            )}
          </div>

          {/* Manual input */}
          <div className="card animate-fadeUp" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Manual Lookup</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                placeholder="Enter pass code e.g. VP-1234567890-ABCDEF..."
                onKeyDown={e => e.key === 'Enter' && lookupPass()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={() => lookupPass()} disabled={loading}>
                <MdSearch /> {loading ? '...' : 'Lookup'}
              </button>
            </div>
          </div>

          {/* Pass result */}
          {passData && (
            <div className="card animate-fadeUp" style={{
              border: `1px solid ${passData.status === 'checked-in' || passData.status === 'active' ? 'var(--accent)' : passData.status === 'checked-out' ? 'var(--accent-2)' : 'var(--danger)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22 }}>{passData.visitor?.name}</h2>
                  <span className={`badge ${passData.status === 'checked-in' || passData.status === 'active' ? 'badge-green' : passData.status === 'checked-out' ? 'badge-blue' : 'badge-red'}`} style={{ marginTop: 6, display: 'inline-flex' }}>
                    {passData.status === 'active' ? '● Active' : passData.status === 'checked-in' ? '✓ Checked In' : passData.status === 'checked-out' ? '✓ Checked Out' : passData.status}
                  </span>
                </div>
                <code style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '4px 10px', borderRadius: 6 }}>
                  {passData.passCode}
                </code>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 20 }}>
                {[
                  { label: 'Email', value: passData.visitor?.email },
                  { label: 'Phone', value: passData.visitor?.phone || '—' },
                  { label: 'Company', value: passData.visitor?.company || '—' },
                  { label: 'Host', value: passData.host?.name || '—' },
                  { label: 'Purpose', value: passData.purpose },
                  { label: 'Valid Until', value: new Date(passData.validUntil).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 14, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="divider" />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {passData.status === 'active' && (
                  <button className="btn btn-primary" onClick={handleCheckIn} disabled={actionLoading} style={{ flex: 1, justifyContent: 'center' }}>
                    <MdCheckCircle /> Check In
                  </button>
                )}
                {passData.status === 'checked-in' && (
                  <button className="btn btn-danger" onClick={handleCheckOut} disabled={actionLoading} style={{ flex: 1, justifyContent: 'center' }}>
                    <MdLogout /> Check Out
                  </button>
                )}
                {(passData.status === 'expired' || passData.status === 'revoked') && (
                  <div style={{ flex: 1, textAlign: 'center', color: 'var(--danger)', fontWeight: 600, padding: 10 }}>
                    ✗ Pass is {passData.status}
                  </div>
                )}
                <button className="btn btn-secondary" onClick={() => { setPassData(null); setQrInput(''); }} style={{ flex: 1, justifyContent: 'center' }}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
