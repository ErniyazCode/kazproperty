
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';

const AdminPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const adminLoggedIn = localStorage.getItem('adminLoggedIn');
      setIsLoggedIn(adminLoggedIn === 'true');
    };
    
    checkAuth();
    
    // Add listener for storage changes
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);
  
  return (
    <MainLayout>
      {isLoggedIn ? <AdminDashboard /> : <AdminLogin />}
    </MainLayout>
  );
};

export default AdminPage;
