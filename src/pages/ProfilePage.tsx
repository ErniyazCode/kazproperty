
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import UserProfile from '@/components/profile/UserProfile';
import { useWeb3 } from '@/contexts/Web3Context';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isConnected } = useWeb3();
  
  useEffect(() => {
    if (!isConnected) {
      toast.error('Пожалуйста, подключите кошелек MetaMask');
      navigate('/');
    }
  }, [isConnected, navigate]);
  
  return (
    <MainLayout>
      <UserProfile />
    </MainLayout>
  );
};

export default ProfilePage;
