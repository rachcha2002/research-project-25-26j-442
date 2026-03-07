import { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfileCompletion() {
  const { doctor, token, login } = useAuth();
  const [form, setForm] = useState({
    gender: '',
    date_of_birth: '',
    phone_number: '',
    country: '',
    license_issuing_authority: '',
    license_country: '',
    license_expiry_date: '',
    specialization: '',
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'profile_photo' && e.target.files) {
      setProfilePhoto(e.target.files[0]);
    }
    if (e.target.name === 'medical_license_document' && e.target.files) {
      setLicenseDoc(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (profilePhoto) formData.append('profile_photo', profilePhoto);
      if (licenseDoc) formData.append('medical_license_document', licenseDoc);

      const res = await api.put('/doctors/complete-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Profile completed successfully!');
      login(res.data.doctor, token!); // Update context with new doctor info

      // Navigate to dashboard after a short delay or immediately
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile completion failed');
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg w-full" style={{ maxWidth: '1000px' }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👣</div>
          <h1 className="text-3xl mb-2 dark:text-white">Peditrack</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>
    <form onSubmit={handleSubmit} className="space-y-2 max-w-2xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} required className="w-full border p-2 rounded">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Date of Birth</label>
          <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>Phone Number</label>
          <input type="text" name="phone_number" placeholder='07XXXXXXXX'
           value={form.phone_number} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div style={{ flex: 1 }}>
          <label>Country</label>
          <input type="text" name="country" placeholder='Sri Lanka'
          value={form.country} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>License Issuing Authority</label>
          <input type="text" name="license_issuing_authority" placeholder='Department of Health Sri Lanka'
          value={form.license_issuing_authority} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div style={{ flex: 1 }}>
          <label>License Country</label>
          <input type="text" name="license_country" placeholder='Sri Lanka'
          value={form.license_country} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>License Expiry Date</label>
          <input type="date" name="license_expiry_date" value={form.license_expiry_date} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div style={{ flex: 1 }}>
          <label>Specialization</label>
          <input type="text" name="specialization" placeholder='Pediatrics, Cardiology'
          value={form.specialization} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>Profile Photo</label>
          <input type="file" id="profile_photo" name="profile_photo" accept="image/*" onChange={handleFileChange} required style={{ display: 'none' }} />
          <button type="button" onClick={() => document.getElementById('profile_photo')?.click()} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1.5rem 1rem', border: '2px dashed #c7d2fe', borderRadius: '0.5rem', backgroundColor: profilePhoto ? '#eef2ff' : '#f9fafb', color: '#6366f1', fontSize: '0.875rem', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '1.5rem' }}>📷</span>
            {profilePhoto ? profilePhoto.name : 'Upload Photo'}
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <label>Medical License Document</label>
          <input type="file" id="medical_license_document" name="medical_license_document" accept="application/pdf,image/*" onChange={handleFileChange} required style={{ display: 'none' }} />
          <button type="button" onClick={() => document.getElementById('medical_license_document')?.click()} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1.5rem 1rem', border: '2px dashed #c7d2fe', borderRadius: '0.5rem', backgroundColor: licenseDoc ? '#eef2ff' : '#f9fafb', color: '#6366f1', fontSize: '0.875rem', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '1.5rem' }}>📄</span>
            {licenseDoc ? licenseDoc.name : 'Upload Document'}
          </button>
        </div>
      </div>

      <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
        Complete Profile
      </button>
    </form>
    </div>
  </div>
  );
}