import { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile completion failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <div>
        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChange} required className="w-full border p-2 rounded">
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label>Date of Birth</label>
        <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>Phone Number</label>
        <input type="text" name="phone_number" value={form.phone_number} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>Country</label>
        <input type="text" name="country" value={form.country} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>License Issuing Authority</label>
        <input type="text" name="license_issuing_authority" value={form.license_issuing_authority} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>License Country</label>
        <input type="text" name="license_country" value={form.license_country} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>License Expiry Date</label>
        <input type="date" name="license_expiry_date" value={form.license_expiry_date} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>Specialization</label>
        <input type="text" name="specialization" value={form.specialization} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>Profile Photo</label>
        <input type="file" name="profile_photo" accept="image/*" onChange={handleFileChange} required className="w-full" />
      </div>
      <div>
        <label>Medical License Document</label>
        <input type="file" name="medical_license_document" accept="application/pdf,image/*" onChange={handleFileChange} required className="w-full" />
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
        Complete Profile
      </button>
    </form>
  );
}