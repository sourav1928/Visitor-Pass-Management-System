import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { passAPI, checkLogAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import {
  MdQrCodeScanner, MdCheckCircle, MdLogout,
  MdSearch, MdCameraAlt, MdStopCircle, MdPerson,
  MdWarning, MdBlock
} from 'react-icons/md';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
        setCameraError('Camera permission denied. Please allow camera access.');
      } else if (err.toString().includes('NotFound')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not start camera. Use manual input below.');
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

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
    return `${API_BASE}${photo}`;
  };

  const statusColor = {
    active: '#00e5a0', 'checked-in': '#00e5a0',
    'checked-out': '#3d7fff', expired: '#ff4d6d', revoked: '#ff4d6d'
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Scan QR Code</h1>
          <p>Scan visitor pass to verify identity and check in/out.</p>
        </div>

        <div style={{ maxWidth: 620 }}>
          {/* Camera */}
          <div className="card animate-fadeUp" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15 }}>Camera Scanner</h3>
              {!cameraActive
                ? <button className="btn btn-primary" onClick={startCamera}><MdCameraAlt /> Open Camera</button>
                : <button className="btn btn-danger" onClick={stopCamera}><MdStopCircle /> Stop</button>
              }
            </div>
            <div style={{ width: '100%', minHeight: 200, background: 'var(--surface-2)', border: `2px ${cameraActive ? 'solid var(--accent)' : 'dashed var(--border)'}`, borderRadius: 10, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div id="qr-scanner-box" style={{ width: '100%' }} />
              {!cameraActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <MdQrCodeScanner style={{ fontSize: 52, color: 'var(--text-muted)' }} />
                  <span style={{ color: cameraError ? 'var(--danger)' : 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '0 20px' }}>
                    {cameraError || 'Click "Open Camera" to start scanning'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Manual input */}
          <div className="card animate-fadeUp" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Manual Lookup</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={qrInput} onChange={e => setQrInput(e.target.value)} placeholder="Enter pass code..." onKeyDown={e => e.key === 'Enter' && lookupPass()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={() => lookupPass()} disabled={loading}>
                <MdSearch /> {loading ? '...' : 'Lookup'}
              </button>
            </div>
          </div>

          {/* Pass result with PHOTO */}
          {passData && (
            <div className="card animate-fadeUp" style={{ border: `2px solid ${statusColor[passData.status] || 'var(--border)'}` }}>

              {/* Visitor identity section — most important for security */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20, padding: '16px', background: 'var(--surface-2)', borderRadius: 10 }}>

                {/* VISITOR PHOTO */}
                <div style={{ flexShrink: 0 }}>
                  {getPhotoUrl(passData.visitor?.photo) ? (
                    <img
                      src={getPhotoUrl(passData.visitor?.photo)}
                      alt={passData.visitor?.name}
                      style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover', border: `3px solid ${statusColor[passData.status] || 'var(--border)'}` }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div style={{ width: 100, height: 100, borderRadius: 12, background: 'var(--border)', display: getPhotoUrl(passData.visitor?.photo) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--border)' }}>
                    <MdPerson style={{ fontSize: 48, color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>VERIFY FACE</div>
                </div>

                {/* Visitor info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{passData.visitor?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{passData.visitor?.email}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{passData.visitor?.phone || '—'}</div>
                  {passData.visitor?.company && <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{passData.visitor.company}</div>}
                  <div style={{ marginTop: 8 }}>
                    <span className={`badge ${passData.status === 'active' || passData.status === 'checked-in' ? 'badge-green' : passData.status === 'checked-out' ? 'badge-blue' : 'badge-red'}`}>
                      {passData.status === 'active' ? '● Active Pass'
                        : passData.status === 'checked-in' ? '✓ Checked In'
                        : passData.status === 'checked-out' ? '✓ Checked Out'
                        : passData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pass details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 20 }}>
                {[
                  { label: 'Pass Code', value: passData.passCode },
                  { label: 'Host', value: passData.host?.name || '—' },
                  { label: 'Purpose', value: passData.purpose },
                  { label: 'Valid Until', value: new Date(passData.validUntil).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 14, marginTop: 2, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Blacklist warning */}
              {passData.visitor?.isBlacklisted && (
                <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MdBlock style={{ color: 'var(--danger)', fontSize: 24, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠️ VISITOR IS BLACKLISTED</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Do not allow entry. Alert supervisor immediately.</div>
                  </div>
                </div>
              )}

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
                  <div style={{ flex: 1, textAlign: 'center', color: 'var(--danger)', fontWeight: 600, padding: 10, background: 'rgba(255,77,109,0.1)', borderRadius: 8 }}>
                    ✗ Pass is {passData.status} — Entry Denied
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
