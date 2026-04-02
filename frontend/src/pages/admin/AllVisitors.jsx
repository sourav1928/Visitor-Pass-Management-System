import { useState, useEffect } from 'react';
import { visitorAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdSearch, MdPersonAdd, MdPerson, MdClose, MdPhone, MdBusiness, MdBadge } from 'react-icons/md';
import toast from 'react-hot-toast';

const AllVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', idType: '', idNumber: '', address: '' });
  const [saving, setSaving] = useState(false);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await visitorAPI.getAll({ search });
      setVisitors(res.data.visitors);
    } catch { toast.error('Failed to load visitors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisitors(); }, [search]);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', email: '', phone: '', company: '', idType: '', idNumber: '', address: '' });
    setShowModal(true);
  };

  const openView = (v) => { setSelected(v); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    setSaving(true);
    try {
      await visitorAPI.create(form);
      toast.success('Visitor created');
      setShowModal(false);
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><h1>Visitors</h1><p>All registered visitors in the system.</p></div>
            <button className="btn btn-primary" onClick={openCreate}><MdPersonAdd /> Add Visitor</button>
          </div>
        </div>

        <div style={{ marginBottom: 20, position: 'relative', maxWidth: 400 }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }} />
          <input placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Total Visits</th><th>Last Visit</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Loading...</td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No visitors found</td></tr>
              ) : visitors.map(v => (
                <tr key={v._id}>
                  <td style={{ fontWeight: 500 }}>{v.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{v.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{v.phone || '—'}</td>
                  <td>{v.company || '—'}</td>
                  <td><span className="badge badge-blue">{v.totalVisits}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {v.lastVisit ? new Date(v.lastVisit).toLocaleDateString() : 'Never'}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => openView(v)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>{selected ? 'Visitor Details' : 'Add Visitor'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 22 }}><MdClose /></button>
            </div>

            {selected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Full Name', value: selected.name },
                  { label: 'Email', value: selected.email },
                  { label: 'Phone', value: selected.phone || '—' },
                  { label: 'Company', value: selected.company || '—' },
                  { label: 'ID Type', value: selected.idType || '—' },
                  { label: 'ID Number', value: selected.idNumber || '—' },
                  { label: 'Address', value: selected.address || '—' },
                  { label: 'Total Visits', value: selected.totalVisits },
                  { label: 'Registered', value: new Date(selected.createdAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{value}</span>
                  </div>
                ))}
                <span className={`badge ${selected.isBlacklisted ? 'badge-red' : 'badge-green'}`} style={{ alignSelf: 'flex-start' }}>
                  {selected.isBlacklisted ? 'Blacklisted' : 'Cleared'}
                </span>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" /></div>
                  <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" /></div>
                  <div className="form-group"><label>Company</label><input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ID Type</label>
                    <select value={form.idType} onChange={e => setForm(p => ({ ...p, idType: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="aadhar">Aadhar</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                  </div>
                  <div className="form-group"><label>ID Number</label><input value={form.idNumber} onChange={e => setForm(p => ({ ...p, idNumber: e.target.value }))} placeholder="ID number" /></div>
                </div>
                <div className="form-group"><label>Address</label><textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} /></div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Create Visitor'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllVisitors;
