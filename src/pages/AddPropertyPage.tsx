
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import PropertyForm from '@/components/property/PropertyForm';
import { useWeb3 } from '@/contexts/Web3Context';

const AddPropertyPage = () => {
  const navigate = useNavigate();
  const { isConnected, account, contract } = useWeb3();
  
  useEffect(() => {
    if (!isConnected) {
      toast.error('Пожалуйста, подключите кошелек MetaMask');
      navigate('/');
    }
  }, [isConnected, navigate]);
  
  useEffect(() => {
    const checkUserVerification = async () => {
      if (contract && account) {
        try {
          const userData = await contract.methods.users(account).call();
          
          if (!userData.isVerified) {
            toast.error('Ваш аккаунт не верифицирован. Пожалуйста, пройдите верификацию в профиле.');
            navigate('/profile');
          }
        } catch (error) {
          console.error('Error checking user verification:', error);
        }
      }
    };
    
    if (isConnected) {
      checkUserVerification();
    }
  }, [account, contract, isConnected, navigate]);
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Добавить объект недвижимости</h1>
        <PropertyForm />
      </div>
    </MainLayout>
  );
};

export default AddPropertyPage;
