import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }: any) => {
  const { user, loading } = useAuth();

  // 1. Wait for the AuthProvider to finish checking the token
  if (loading) {
    return <div>Loading...</div>; 
  }

  // 2. Redirect to login if no user is found
  return user ? children : <Navigate to="/login" />;
};