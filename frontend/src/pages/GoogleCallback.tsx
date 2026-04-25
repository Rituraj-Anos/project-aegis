import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { tokenStore } from '../auth/tokenStore';
import apiClient from '../lib/api/client';
import FullPageSpinner from '../components/FullPageSpinner';
import toast from 'react-hot-toast';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // Immediately clear token from URL bar
    window.history.replaceState({}, '', '/auth/google/callback');

    if (!token) {
      toast.error('Google login failed — no token received.');
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        tokenStore.setToken(token);
        const { data: user } = await apiClient.get('/users/me');
        login(token, user);
        navigate('/dashboard', { replace: true });
      } catch {
        tokenStore.clearToken();
        toast.error('Google login failed. Please try again.');
        navigate('/login', { replace: true });
      }
    })();
  }, [login, navigate]);

  return <FullPageSpinner message="Signing you in with Google…" />;
}
