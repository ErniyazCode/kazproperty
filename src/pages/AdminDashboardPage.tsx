
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '@/components/admin/AdminDashboard';
import MainLayout from '@/components/layout/MainLayout';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (adminLoggedIn !== 'true') {
      navigate('/admin');
    }
  }, [navigate]);
  
  return (
    <MainLayout>
      <AdminDashboard />
    </MainLayout>
  );
};

export default AdminDashboardPage;
