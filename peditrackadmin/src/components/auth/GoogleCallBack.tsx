import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const doctorStr = params.get('doctor');
    if (token && doctorStr) {
      const doctor = JSON.parse(decodeURIComponent(doctorStr));
      login(doctor, token);
      if (doctor.account_status === 'Inactive') {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  // FIX: Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return <div>Signing you in with Google...</div>;
}