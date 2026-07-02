import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../api/api';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // You might need to set a default header for this to work
          // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await authService.getMe();
          setUser(data);
        } catch (err) {
          localStorage.removeItem('token'); // Token expired/invalid
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);