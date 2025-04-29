import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, X, Users, Home, FileCheck, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/contexts/Web3Context';
import axios from 'axios';

interface User {
  address: string;
  name: string;
  isVerified: boolean;
  kycDocument: string;
  createdAt: Date;
}

interface Property {
  id: number;
  title: string;
  owner: string;
  location: string;
  price: number;
  isApproved: boolean;
  createdAt: Date;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { account, contract } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      // First check localStorage
      const adminLoggedIn = localStorage.getItem('adminLoggedIn');
      
      if (!adminLoggedIn) {
        navigate('/admin');
        return;
      }
      
      // Then check contract if available
      if (contract && account) {
        try {
          const contractAdmin = await contract.methods.admin().call();
          setIsAdmin(account === contractAdmin || adminLoggedIn === 'true');
          
          if (account !== contractAdmin && !adminLoggedIn) {
            toast.error('У вас нет прав администратора');
            navigate('/admin');
          }
        } catch (error) {
          console.error('Error checking admin:', error);
          // Fallback to localStorage if contract check fails
          setIsAdmin(adminLoggedIn === 'true');
        }
      } else {
        // If no contract, rely on localStorage
        setIsAdmin(adminLoggedIn === 'true');
      }
    };
    
    checkAdmin();
    
    if (isAdmin || localStorage.getItem('adminLoggedIn') === 'true') {
      loadUsers();
      loadProperties();
    }
  }, [account, contract, navigate]);

  const loadUsers = async () => {
    try {
      // First try to load from API
      try {
        const response = await axios.get('http://localhost:5000/api/users', { timeout: 3000 });
        if (response.data && Array.isArray(response.data)) {
          const apiUsers = response.data.map((user: any) => ({
            address: user.address,
            name: user.name,
            isVerified: user.isVerified,
            kycDocument: user.kycDocument,
            createdAt: new Date(user.createdAt)
          }));
          
          if (apiUsers.length > 0) {
            console.log('Users loaded from API:', apiUsers.length);
            setUsers(apiUsers);
            return;
          }
        }
      } catch (apiError) {
        console.error('Error loading users from API:', apiError);
      }
      
      // Fall back to blockchain
      if (contract) {
        // This is a simplified approach - in a real app you would need pagination
        const userCount = 10; // Arbitrary limit
        const blockchainUsers: User[] = [];
        
        // Use sample addresses for demonstration
        const sampleAddresses = [
          '0xE224597F4D54bA16E38308468280Ef0E7a2F76cA',
          '0x1234567890123456789012345678901234567890',
          '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12'
        ];
        
        for (let i = 0; i < sampleAddresses.length; i++) {
          try {
            const address = sampleAddresses[i];
            const userData = await contract.methods.users(address).call();
            
            if (userData.name) {
              blockchainUsers.push({
                address,
                name: userData.name,
                isVerified: userData.isVerified,
                kycDocument: userData.kycDocument,
                createdAt: new Date(Date.now() - Math.random() * 10000000000)
              });
            }
          } catch (error) {
            console.error('Error loading user', i, error);
          }
        }
        
        if (blockchainUsers.length > 0) {
          console.log('Users loaded from blockchain:', blockchainUsers.length);
          setUsers(blockchainUsers);
          return;
        }
      }
      
      // If both methods fail, use mock data
      console.log('Using mock user data');
      const mockUsers: User[] = [
        {
          address: '0xE224597F4D54bA16E38308468280Ef0E7a2F76cA',
          name: 'Александр Петров',
          isVerified: false,
          kycDocument: 'https://gateway.pinata.cloud/ipfs/QmNjk1zzw2mkkBNk7qcXp9vL4JeBBC3RpZu5LMsmF7DdeN',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          address: '0x1234567890123456789012345678901234567890',
          name: 'Елена Иванова',
          isVerified: true,
          kycDocument: 'https://gateway.pinata.cloud/ipfs/QmZ4j1xQ3rwZsEKXhFwqxBnDJGfAq1Tb4DMHnYZd3kBM5a',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          address: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
          name: 'Михаил Сидоров',
          isVerified: false,
          kycDocument: '',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadProperties = async () => {
    try {
      // First try to load from API
      try {
        const response = await axios.get('http://localhost:5000/api/properties', { timeout: 3000 });
        if (response.data && Array.isArray(response.data)) {
          const apiProperties = response.data.map((property: any) => ({
            id: property.id,
            title: property.title,
            owner: property.owner,
            location: property.location,
            price: property.price,
            isApproved: property.isApproved,
            createdAt: new Date(property.createdAt)
          }));
          
          if (apiProperties.length > 0) {
            console.log('Properties loaded from API:', apiProperties.length);
            setProperties(apiProperties);
            return;
          }
        }
      } catch (apiError) {
        console.error('Error loading properties from API:', apiError);
      }
      
      // Fall back to blockchain
      if (contract) {
        try {
          const propertyCount = await contract.methods.getPropertyCount().call();
          const propertyList: Property[] = [];
          
          for (let i = 1; i <= Math.min(propertyCount, 20); i++) {
            try {
              const property = await contract.methods.properties(i).call();
              
              propertyList.push({
                id: parseInt(property.id),
                title: property.title,
                owner: property.owner,
                location: property.location,
                price: parseFloat(property.price) / 1e18,
                isApproved: property.isApproved,
                createdAt: new Date(Date.now() - Math.random() * 10000000000)
              });
            } catch (error) {
              console.error('Error loading property', i, error);
            }
          }
          
          if (propertyList.length > 0) {
            console.log('Properties loaded from blockchain:', propertyList.length);
            setProperties(propertyList);
            return;
          }
        } catch (contractError) {
          console.error('Error loading properties from contract:', contractError);
        }
      }
      
      // If both methods fail, use mock data
      console.log('Using mock property data');
      const mockProperties: Property[] = [
        {
          id: 1,
          title: '3-комнатная квартира в ЖК "Премиум"',
          owner: '0xE224597F4D54bA16E38308468280Ef0E7a2F76cA',
          location: 'Алматы',
          price: 5.2,
          isApproved: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          title: '2-комнатная квартира с видом на горы',
          owner: '0x1234567890123456789012345678901234567890',
          location: 'Астана',
          price: 3.8,
          isApproved: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 3,
          title: 'Студия в центре города',
          owner: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
          location: 'Шымкент',
          price: 2.5,
          isApproved: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];
      
      setProperties(mockProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const verifyUser = async (userAddress: string) => {
    if (!contract && !account) {
      // Try to verify via API first
      setIsVerifying(true);
      
      try {
        await axios.put(`http://localhost:5000/api/users/${userAddress}/verify`);
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.address === userAddress ? { ...user, isVerified: true } : user
          )
        );
        
        toast.success('Пользователь успешно верифицирован');
      } catch (apiError) {
        console.error('Error verifying user via API:', apiError);
        toast.error('Ошибка при верификации пользователя через API');
      } finally {
        setIsVerifying(false);
      }
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // First try API
      try {
        await axios.put(`http://localhost:5000/api/users/${userAddress}/verify`);
        console.log('User verified via API');
      } catch (apiError) {
        console.error('Error verifying user via API:', apiError);
      }
      
      // Then blockchain
      await contract.methods.verifyUser(userAddress).send({ from: account });
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.address === userAddress ? { ...user, isVerified: true } : user
        )
      );
      
      toast.success('Пользователь успешно верифицирован');
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Ошибка при верификации пользователя');
    } finally {
      setIsVerifying(false);
    }
  };

  const approveProperty = async (propertyId: number) => {
    if (!contract && !account) {
      // Try to approve via API first
      setIsApproving(true);
      
      try {
        await axios.put(`http://localhost:5000/api/properties/${propertyId}/approve`);
        
        setProperties(prevProperties => 
          prevProperties.map(property => 
            property.id === propertyId ? { ...property, isApproved: true } : property
          )
        );
        
        toast.success('Объект недвижимости успешно одобрен');
      } catch (apiError) {
        console.error('Error approving property via API:', apiError);
        toast.error('Ошибка при одобрении объекта через API');
      } finally {
        setIsApproving(false);
      }
      return;
    }
    
    setIsApproving(true);
    
    try {
      // First try API
      try {
        await axios.put(`http://localhost:5000/api/properties/${propertyId}/approve`);
        console.log('Property approved via API');
      } catch (apiError) {
        console.error('Error approving property via API:', apiError);
      }
      
      // Then blockchain
      await contract.methods.approveProperty(propertyId).send({ from: account });
      
      setProperties(prevProperties => 
        prevProperties.map(property => 
          property.id === propertyId ? { ...property, isApproved: true } : property
        )
      );
      
      toast.success('Объект недвижимости успешно одобрен');
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error('Ошибка при одобрении объекта');
    } finally {
      setIsApproving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    navigate('/admin');
  };

  if (!isAdmin && localStorage.getItem('adminLoggedIn') !== 'true') {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Админ панель</h1>
        <Button 
          variant="destructive" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Выход
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Пользователи
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-bold">{users.length}</div>
          </CardContent>
          <CardFooter>
            <CardDescription className="text-xs">
              Всего зарегистрировано пользователей
            </CardDescription>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Home className="h-5 w-5 mr-2 text-primary" />
              Объекты недвижимости
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-bold">{properties.length}</div>
          </CardContent>
          <CardFooter>
            <CardDescription className="text-xs">
              Всего объявлений в системе
            </CardDescription>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileCheck className="h-5 w-5 mr-2 text-primary" />
              Ожидают проверки
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-bold">
              {users.filter(user => !user.isVerified).length + 
               properties.filter(property => !property.isApproved).length}
            </div>
          </CardContent>
          <CardFooter>
            <CardDescription className="text-xs">
              Требуют проверки администратором
            </CardDescription>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="properties">Объекты недвижимости</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Управление пользователями</CardTitle>
              <CardDescription>
                Просмотр и подтверждение верификации пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Адрес кошелька</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Документы</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{`${user.address.substring(0, 6)}...${user.address.substring(user.address.length - 4)}`}</TableCell>
                        <TableCell>
                          {user.isVerified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Верифицирован
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                              Ожидает проверки
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.kycDocument ? (
                            <a 
                              href={user.kycDocument} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Просмотреть
                            </a>
                          ) : (
                            "Нет документов"
                          )}
                        </TableCell>
                        <TableCell>
                          {!user.isVerified ? (
                            <Button 
                              size="sm" 
                              onClick={() => verifyUser(user.address)}
                              disabled={isVerifying}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Подтвердить
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              Подтвержден
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        Нет данных о пользователях
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Управление объектами недвижимости</CardTitle>
              <CardDescription>
                Просмотр и одобрение объявлений о недвижимости
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Местоположение</TableHead>
                    <TableHead>Цена (ETH)</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.length > 0 ? (
                    properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>{property.id}</TableCell>
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>{property.location}</TableCell>
                        <TableCell>{property.price}</TableCell>
                        <TableCell>
                          {property.isApproved ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Одобрено
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                              Ожидает проверки
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!property.isApproved ? (
                            <Button 
                              size="sm"
                              onClick={() => approveProperty(property.id)}
                              disabled={isApproving}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Одобрить
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              Одобрено
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        Нет данных о недвижимости
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
