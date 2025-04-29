
import { Link } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import MetaMaskButton from '@/components/auth/MetaMaskButton';
import { Building, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { isConnected } = useWeb3();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Building className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-semibold text-gray-800">KazProperty</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-600 hover:text-primary transition-colors">
            Главная
          </Link>
          <Link to="/properties" className="text-gray-600 hover:text-primary transition-colors">
            Недвижимость
          </Link>
          {isConnected && (
            <>
              <Link to="/add-property" className="text-gray-600 hover:text-primary transition-colors">
                Добавить объявление
              </Link>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {isConnected && (
            <Link to="/profile">
              <Button variant="outline" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <Link to="/admin">
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <MetaMaskButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
