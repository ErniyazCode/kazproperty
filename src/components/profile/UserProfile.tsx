import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload, Check, User, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/contexts/Web3Context';
import PinataService from '@/services/PinataService';
import PropertyCard from '@/components/property/PropertyCard';
import axios from 'axios';

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  rooms: number;
  squareMeters: number;
  imageUrl: string;
  isSold: boolean;
}

const SERVER_URL = 'http://localhost:5000';

const UserProfile = () => {
  const navigate = useNavigate();
  const { account, contract } = useWeb3();
  const [name, setName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [hasSignedECP, setHasSignedECP] = useState(false);
  const [kycDocument, setKycDocument] = useState<File | null>(null);
  const [kycDocumentUrl, setKycDocumentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [listedProperties, setListedProperties] = useState<Property[]>([]);
  const [purchasedProperties, setPurchasedProperties] = useState<Property[]>([]);
  
  useEffect(() => {
    if (account) {
      console.log('Current MetaMask account:', account);
      loadUserData();
      if (contract) {
        loadUserProperties();
      }
    } else {
      console.log('No MetaMask account connected');
    }
  }, [account, contract]);
  
  const loadUserData = async () => {
    try {
      if (account) {
        // First try to get data from contract if available
        if (contract) {
          console.log('Loading user data from contract for address:', account);
          const user = await contract.methods.users(account).call();
          console.log('User data from contract:', {
            name: user.name,
            isVerified: user.isVerified,
            hasSignedECP: user.hasSignedECP,
            kycDocument: user.kycDocument
          });
          
          setName(user.name || '');
          setIsVerified(user.isVerified || false);
          setHasSignedECP(user.hasSignedECP || false);
          
          if (user.kycDocument && user.kycDocument.startsWith('http')) {
            setKycDocumentUrl(user.kycDocument);
          }
        }
        
        // Then try to get additional data from the backend
        try {
          console.log('Loading user data from backend for address:', account);
          const response = await axios.get(`${SERVER_URL}/api/users/${account}`);
          console.log('User data from backend:', {
            name: response.data.name,
            isVerified: response.data.isVerified,
            hasSignedECP: response.data.hasSignedECP,
            kycDocument: response.data.kycDocument
          });
          
          if (response.data) {
            // Backend data takes precedence for some fields
            setName(response.data.name || name);
            setIsVerified(response.data.isVerified || isVerified);
            setHasSignedECP(response.data.hasSignedECP || hasSignedECP);
            
            if (response.data.kycDocument) {
              setKycDocumentUrl(response.data.kycDocument);
            }
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log('User not found in backend for address:', account);
          } else {
            console.error('Error loading user data from backend:', error);
          }
        }
      } else {
        console.log('Cannot load user data: No account connected');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Не удалось загрузить данные пользователя');
    }
  };
  
  const loadUserProperties = async () => {
    try {
      if (contract && account) {
        console.log('Loading properties for user address:', account);
        // Get user's property IDs
        const propertyIds = await contract.methods.getUserProperties(account).call();
        console.log('User property IDs from contract:', propertyIds);
        
        if (propertyIds.length > 0) {
          // Load property details
          console.log('Loading details for properties:', propertyIds);
          const properties = await Promise.all(
            propertyIds.map(async (id: number) => {
              const property = await contract.methods.properties(id).call();
              console.log(`Property ${id} details:`, property);
              
              return {
                id: parseInt(property.id),
                title: property.title,
                location: property.location,
                price: parseFloat(property.price) / 1e18,
                rooms: parseInt(property.roomCount),
                squareMeters: parseInt(property.squareMeters),
                imageUrl: Array.isArray(property.images) && property.images.length > 0
                  ? property.images[0]
                  : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80',
                isSold: property.isSold
              };
            })
          );
          
          console.log('Loaded properties for user:', properties);
          
          // Filter listed and purchased properties
          const listed = properties.filter((p: Property) => !p.isSold);
          const purchased = properties.filter((p: Property) => p.isSold);
          
          console.log('Listed properties:', listed);
          console.log('Purchased properties:', purchased);
          
          setListedProperties(listed);
          setPurchasedProperties(purchased);
        } else {
          console.log('User has no properties in contract');
          setListedProperties([]);
          setPurchasedProperties([]);
        }
      } else {
        console.log('Cannot load properties: No contract or account available');
      }
    } catch (error) {
      console.error('Error loading user properties:', error);
      toast.error('Не удалось загрузить объекты недвижимости');
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Пожалуйста, введите имя');
      return;
    }
    
    if (!account) {
      toast.error('Требуется подключение к MetaMask');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      let documentUrl = kycDocumentUrl;
      
      // Upload KYC document if provided
      if (kycDocument) {
        setIsUploading(true);
        console.log('Uploading KYC document to Pinata...');
        const uploadResult = await PinataService.uploadFile(kycDocument);
        setIsUploading(false);
        
        if (!uploadResult.success) {
          throw new Error('Не удалось загрузить документ');
        }
        
        documentUrl = uploadResult.url;
        setKycDocumentUrl(documentUrl);
        console.log('Document uploaded to:', documentUrl);
      }
      
      // Update profile in backend
      try {
        console.log('Checking if user exists in backend...');
        const checkUser = await axios.get(`${SERVER_URL}/api/users/${account}`);
        
        if (checkUser.data) {
          // Update existing user
          console.log('Updating existing user in backend...');
          await axios.put(`${SERVER_URL}/api/users/${account}/kyc`, {
            kycDocument: documentUrl
          });
        } else {
          // Create new user
          console.log('Creating new user in backend...');
          await axios.post(`${SERVER_URL}/api/users`, {
            address: account,
            name: name
          });
          
          if (documentUrl) {
            await axios.put(`${SERVER_URL}/api/users/${account}/kyc`, {
              kycDocument: documentUrl
            });
          }
        }
        
        console.log('Backend update successful');
      } catch (error) {
        console.error('Error updating backend:', error);
        // If user doesn't exist, create new user
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.log('Creating new user in backend...');
          await axios.post(`${SERVER_URL}/api/users`, {
            address: account,
            name: name
          });
          
          if (documentUrl) {
            await axios.put(`${SERVER_URL}/api/users/${account}/kyc`, {
              kycDocument: documentUrl
            });
          }
        } else {
          throw error;
        }
      }
      
      // Update user profile via smart contract if available
      if (contract) {
        console.log('Updating profile in contract...');
        await contract.methods.registerUser(
          name,
          documentUrl
        ).send({ from: account });
        console.log('Contract update successful');
      }
      
      toast.success('Профиль успешно обновлен');
      loadUserData(); // Refresh data
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Произошла ошибка при обновлении профиля');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSignECP = async () => {
    if (!account) {
      toast.error('Пожалуйста, подключите MetaMask');
      return;
    }
    
    setIsSigning(true);
    
    try {
      // Update in smart contract if available
      if (contract) {
        console.log('Signing ECP in contract...');
        await contract.methods.signECP().send({ from: account });
        console.log('Contract ECP signing successful');
      }
      
      // Update in backend
      try {
        console.log('Updating ECP status in backend...');
        await axios.put(`${SERVER_URL}/api/users/${account}/ecp`);
        console.log('Backend ECP update successful');
      } catch (error) {
        console.error('Error updating ECP in backend:', error);
        // Continue even if backend fails
      }
      
      setHasSignedECP(true);
      toast.success('ЭЦП успешно подписан');
    } catch (error) {
      console.error('Error signing ECP:', error);
      toast.error('Произошла ошибка при подписании ЭЦП');
    } finally {
      setIsSigning(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setKycDocument(e.target.files[0]);
    }
  };
  
  if (!account) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-16 h-16 mx-auto text-gray-300" />
            <h2 className="text-2xl font-bold mt-4">Вход не выполнен</h2>
            <p className="text-gray-500 mt-2 mb-6">Пожалуйста, подключите MetaMask чтобы получить доступ к профилю</p>
            <Button onClick={() => navigate('/')}>На главную</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Профиль пользователя</h1>
        {isVerified && (
          <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600 px-3 py-1">
            <Check className="w-4 h-4" />
            Верифицирован
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6">
        <Card className="h-fit">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarFallback className="bg-primary text-white text-xl">
                  {name ? name.charAt(0).toUpperCase() : account.charAt(1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-lg font-semibold">{name || 'Пользователь'}</p>
              <p className="text-sm text-gray-500 mt-1">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              
              <div className="w-full border-t border-gray-200 my-4 pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Статус KYC:</span>
                    <span className={isVerified ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                      {isVerified ? 'Подтвержден' : 'На рассмотрении'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ЭЦП:</span>
                    <span className={hasSignedECP ? "text-green-600 font-medium" : "text-gray-600 font-medium"}>
                      {hasSignedECP ? 'Подписан' : 'Не подписан'}
                    </span>
                  </div>
                </div>
              </div>
              
              {!isVerified && kycDocumentUrl && (
                <div className="w-full bg-amber-50 p-3 rounded-md border border-amber-200 mt-2 text-sm text-amber-800">
                  Ваша заявка на верификацию в процессе рассмотрения администрацией.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация профиля</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium block mb-1">
                      ФИО
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Введите ваше полное имя"
                      required
                    />
                  </div>
                  
                  {!kycDocumentUrl && (
                    <div>
                      <label className="text-sm font-medium block mb-1">
                        Загрузите документ для KYC верификации
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="mb-1 text-sm text-gray-500">
                              <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
                            </p>
                            <p className="text-xs text-gray-500">PDF или JPG (макс. 10MB)</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {kycDocument && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 border rounded-md mt-2">
                          <span className="text-sm truncate">{kycDocument.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setKycDocument(null)}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {kycDocumentUrl && (
                    <div className="flex items-center p-3 bg-gray-50 border rounded-md">
                      <FileCheck className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm">Документ загружен</span>
                    </div>
                  )}
                  
                  {!hasSignedECP && (
                    <div className="pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isSigning}
                        onClick={handleSignECP}
                      >
                        {isSigning ? 'Подписание...' : 'Подписать ЭЦП'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Для совершения операций на платформе требуется подписание ЭЦП
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isUpdating || isUploading}
                    >
                      {isUpdating 
                        ? 'Обновление...' 
                        : isUploading 
                          ? 'Загрузка документа...' 
                          : 'Обновить профиль'
                      }
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Мои объекты недвижимости</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="listed">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="listed">Мои объявления</TabsTrigger>
                  <TabsTrigger value="purchased">Приобретенные</TabsTrigger>
                </TabsList>
                <TabsContent value="listed" className="pt-4">
                  {listedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {listedProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          id={property.id}
                          title={property.title}
                          location={property.location}
                          price={property.price}
                          rooms={property.rooms}
                          squareMeters={property.squareMeters}
                          imageUrl={property.imageUrl}
                          isSold={property.isSold}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">У вас пока нет объявлений</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => navigate('/add-property')}
                      >
                        Добавить объявление
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="purchased" className="pt-4">
                  {purchasedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {purchasedProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          id={property.id}
                          title={property.title}
                          location={property.location}
                          price={property.price}
                          rooms={property.rooms}
                          squareMeters={property.squareMeters}
                          imageUrl={property.imageUrl}
                          isSold={property.isSold}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">У вас пока нет приобретенной недвижимости</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => navigate('/properties')}
                      >
                        Посмотреть объявления
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
