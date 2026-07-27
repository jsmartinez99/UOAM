import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export { PrivateRoute };
export default PrivateRoute;
