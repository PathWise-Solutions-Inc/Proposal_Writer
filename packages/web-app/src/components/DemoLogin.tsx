import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';

const DemoLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleDemoLogin = () => {
    // For demo purposes, create a mock user session
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'user',
      organizationId: 'demo-org-id'
    };

    const demoTokens = {
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token'
    };

    // Dispatch login success
    dispatch(login({
      user: demoUser,
      ...demoTokens
    }));

    // Store tokens
    localStorage.setItem('accessToken', demoTokens.accessToken);
    localStorage.setItem('refreshToken', demoTokens.refreshToken);

    // Navigate to RFP upload
    navigate('/rfps/upload');
  };

  return (
    <Button
      variant="outlined"
      fullWidth
      onClick={handleDemoLogin}
      sx={{ mt: 2 }}
    >
      Continue with Demo Account
    </Button>
  );
};

export default DemoLogin;