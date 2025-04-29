import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { MapPin, Bed, Square, FileText, User, Calendar, ExternalLink, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { useWeb3 } from '@/contexts/Web3Context';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
interface Transaction {
  id: number;
  propertyId: number;
  seller: string;
  buyer: string;
  price: number;
  timestamp: number;
}
const PropertyDetailPage = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    web3,
    account,
    contract,
    isConnected
  } = useWeb3();
  const [property, setProperty] = useState<any>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isECPSigned, setIsECPSigned] = useState<boolean>(false);
  const [isSigningECP, setIsSigningECP] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    const loadProperty = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        console.log(`Loading property ${id} details...`);

        // Try loading from local API first
        try {
          console.log('Attempting to load property from API...');
          const response = await axios.get(`http://localhost:5000/api/properties/${id}`, {
            timeout: 3000
          });
          console.log('Property data from API:', response.data);
          if (response.data) {
            const propertyData = response.data;
            setProperty({
              id: propertyData.id,
              propertyIdFromContract: propertyData.propertyIdFromContract ?? propertyData.contractId ?? propertyData.contract_id ?? propertyData.contractID ?? propertyData.id, // поддержка разных вариантов
              title: propertyData.title,
              description: propertyData.description || "Нет описания",
              location: propertyData.location,
              price: propertyData.price,
              roomCount: propertyData.roomCount,
              squareMeters: propertyData.squareMeters,
              images: Array.isArray(propertyData.images) && propertyData.images.length > 0 ? propertyData.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80'],
              documents: propertyData.documents,
              isApproved: propertyData.isApproved,
              isSold: propertyData.isSold
            });
            setOwner(propertyData.owner);

            // Try loading transactions
            try {
              const txResponse = await axios.get(`http://localhost:5000/api/properties/${id}/transactions`, {
                timeout: 3000
              });
              console.log('Transaction data from API:', txResponse.data);
              if (txResponse.data && txResponse.data.length > 0) {
                setTransactions(txResponse.data.map((tx: any) => ({
                  id: tx.id,
                  propertyId: tx.propertyId,
                  seller: tx.seller,
                  buyer: tx.buyer,
                  price: tx.price,
                  timestamp: new Date(tx.timestamp).getTime() / 1000
                })));
              }
            } catch (txError) {
              console.error('Error loading transactions from API:', txError);
            }

            // Check if user has signed ECP
            if (account) {
              try {
                const userResponse = await axios.get(`http://localhost:5000/api/users/${account}`, {
                  timeout: 3000
                });
                setIsECPSigned(userResponse.data.hasSignedECP);
              } catch (userError) {
                console.error('Error checking user ECP status from API:', userError);

                // Fall back to blockchain
                if (contract) {
                  try {
                    const userData = await contract.methods.users(account).call();
                    setIsECPSigned(userData.hasSignedECP);
                  } catch (blockchainUserError) {
                    console.error('Error checking ECP status from blockchain:', blockchainUserError);
                  }
                }
              }
            }
            setIsLoading(false);
            return;
          }
        } catch (apiError: any) {
          console.error('Error loading property from API:', apiError.message || apiError);
        }

        // Fall back to blockchain if available
        if (contract && property && property.propertyIdFromContract) {
          try {
            console.log('Attempting to load property from contract...');
            const propertyData = await contract.methods.properties(property.propertyIdFromContract).call();
            console.log('Property data from contract:', propertyData);
            if (parseInt(propertyData.id) > 0) {
              setProperty({
                id: parseInt(propertyData.id),
                title: propertyData.title,
                description: propertyData.description || "Нет описания",
                location: propertyData.location,
                price: parseFloat(propertyData.price) / 1e18,
                roomCount: parseInt(propertyData.roomCount),
                squareMeters: parseInt(propertyData.squareMeters),
                images: Array.isArray(propertyData.images) && propertyData.images.length > 0 ? propertyData.images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80'],
                documents: propertyData.documents,
                isApproved: propertyData.isApproved,
                isSold: propertyData.isSold
              });
              setOwner(propertyData.owner);

              // Load transaction history
              try {
                const transactionIds = await contract.methods.getPropertyTransactions(id).call();
                console.log('Transaction IDs:', transactionIds);
                if (transactionIds.length > 0) {
                  const transactionsData = await Promise.all(transactionIds.map((transId: number) => contract.methods.transactions(transId).call()));
                  console.log('Transactions data:', transactionsData);
                  setTransactions(transactionsData.map((tx: any) => ({
                    id: parseInt(tx.id),
                    propertyId: parseInt(tx.propertyId),
                    seller: tx.seller,
                    buyer: tx.buyer,
                    price: parseFloat(tx.price) / 1e18,
                    timestamp: parseInt(tx.timestamp)
                  })));
                }
              } catch (txError) {
                console.error('Error loading transactions from contract:', txError);
              }

              // Check if user has signed ECP
              if (account) {
                try {
                  const userData = await contract.methods.users(account).call();
                  setIsECPSigned(userData.hasSignedECP);
                } catch (ecpError) {
                  console.error('Error checking ECP status:', ecpError);
                }
              }
              setIsLoading(false);
              return;
            }
          } catch (contractError) {
            console.error('Error loading property from contract:', contractError);
          }
        }

        // If all loading methods failed, use mock data
        console.log('Using mock property data');
        loadMockProperty();
      } catch (error: any) {
        console.error('General error loading property:', error.message || error);
        setLoadError('Произошла ошибка при загрузке данных');
        loadMockProperty();
      }
    };
    const loadMockProperty = () => {
      console.log('Loading mock property data');
      setProperty({
        id: parseInt(id || '1'),
        title: '3-комнатная квартира в ЖК "Премиум"',
        description: 'Шикарная квартира в центре города с видом на парк. Полностью меблированная, с новым ремонтом. В квартире 3 просторные комнаты, большая кухня, 2 санузла. Во дворе детская площадка, паркинг.',
        location: 'Алматы',
        price: 5.2,
        roomCount: 3,
        squareMeters: 85,
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1170&q=80', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1080&q=80', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1080&q=80'],
        documents: 'https://ipfs.io/ipfs/QmZ4j1xQ3rwZsEKXhFwqxBnDJGfAq1Tb4DMHnYZd3kBM5a',
        isApproved: true,
        isSold: false
      });
      setOwner('0x1234567890123456789012345678901234567890');
      setIsLoading(false);
    };
    loadProperty();
  }, [contract, id, account, navigate]);
  const handleSignECP = async () => {
    if (!account || !contract) {
      toast.error('Пожалуйста, подключите кошелек');
      return;
    }
    setIsSigningECP(true);
    try {
      console.log('Signing ECP...');

      // Try to update ECP status on server
      try {
        console.log('Updating ECP status in backend...');
        await axios.put(`http://localhost:5000/api/users/${account}/ecp`, {}, {
          timeout: 3000
        });
        console.log('ECP status updated in backend');
      } catch (apiError) {
        console.error('Error updating ECP in backend:', apiError);
      }

      // Update in blockchain
      await contract.methods.signECP().send({
        from: account
      });
      setIsECPSigned(true);
      toast.success('ЭЦП успешно подписан');
    } catch (error: any) {
      console.error('Error signing ECP:', error);
      toast.error('Произошла ошибка при подписании ЭЦП');
    } finally {
      setIsSigningECP(false);
    }
  };
  const handleBuyProperty = async () => {
    if (!account || !contract || !property) {
      toast.error('Пожалуйста, подключите кошелек');
      return;
    }
    if (!isECPSigned) {
      toast.error('Необходимо подписать ЭЦП перед покупкой');
      return;
    }
    if (account === owner) {
      toast.error('Вы не можете купить свою собственную недвижимость');
      return;
    }
    setIsPurchasing(true);
    try {
      const contractId = property.propertyIdFromContract ?? property.id;
      console.log('Buying property (contract id):', contractId);
      const priceInWei = web3?.utils.toWei(property.price.toString(), 'ether');
      console.log('Price in wei:', priceInWei);
      await contract.methods.buyProperty(Number(contractId)).send({
        from: account,
        value: priceInWei
      });
      toast.success('Поздравляем! Недвижимость успешно куплена');

      // Refresh property data
      const updatedProperty = await contract.methods.properties(contractId).call();
      setProperty({
        ...property,
        isSold: updatedProperty.isSold
      });

      // Reload transactions
      console.log('Reloading transaction history');
      const transactionIds = await contract.methods.getPropertyTransactions(property.id).call();
      if (transactionIds.length > 0) {
        const transactionsData = await Promise.all(transactionIds.map((transId: number) => contract.methods.transactions(transId).call()));
        setTransactions(transactionsData.map((tx: any) => ({
          id: parseInt(tx.id),
          propertyId: parseInt(tx.propertyId),
          seller: tx.seller,
          buyer: tx.buyer,
          price: parseFloat(tx.price) / 1e18,
          timestamp: parseInt(tx.timestamp)
        })));
      }

      // Try to update status in database
      try {
        await axios.put(`http://localhost:5000/api/properties/${property.id}/sell`, {
          buyer: account,
          transactionHash: 'blockchain_transaction' // In a real case, this would be the transaction hash
        }, {
          timeout: 3000
        });
        console.log('Property status updated in backend');
      } catch (apiError) {
        console.error('Error updating property status in backend:', apiError);
      }
    } catch (error: any) {
      console.error('Error buying property:', error);
      toast.error('Произошла ошибка при покупке недвижимости');
    } finally {
      setIsPurchasing(false);
    }
  };
  if (isLoading) {
    return <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>;
  }
  if (loadError || !property) {
    return <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              {loadError || 'Объект недвижимости не найден'}
            </h1>
            <Button asChild>
              <Link to="/properties">Вернуться к списку</Link>
            </Button>
          </div>
        </div>
      </MainLayout>;
  }
  return <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4 flex items-center gap-2" asChild>
          <Link to="/properties">
            <ArrowLeft className="h-4 w-4" />
            Назад к списку
          </Link>
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            {/* Property images */}
            <div className="relative">
              {property.isSold && <div className="absolute top-4 right-4 z-20">
                  <Badge variant="destructive" className="px-3 py-1 text-lg font-semibold">
                    ПРОДАНО
                  </Badge>
                </div>}
              
              <Swiper spaceBetween={0} slidesPerView={1} modules={[Navigation, Pagination]} navigation pagination={{
              clickable: true
            }} className="rounded-lg overflow-hidden h-[400px]">
                {property.images && property.images.length > 0 ? property.images.map((image: string, index: number) => <SwiperSlide key={index} className="flex items-center justify-center">
                      <img src={image} alt={`${property.title} - изображение ${index + 1}`} className="w-full h-full object-contain max-h-[400px]" />
                    </SwiperSlide>) : <SwiperSlide className="flex items-center justify-center">
                    <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80" alt="Placeholder" className="w-full h-full object-contain max-h-[400px]" />
                  </SwiperSlide>}
              </Swiper>
            </div>
            
            {/* Property details */}
            <div>
              <h1 className="text-2xl font-bold">{property.title}</h1>
              
              <div className="flex items-center mt-2 text-gray-500">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{property.location}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{property.roomCount} комнат{property.roomCount > 1 ? 'ы' : 'а'}</span>
                </div>
                
                <div className="flex items-center">
                  <Square className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{property.squareMeters} м²</span>
                </div>
                
                <div className="flex items-center">
                  <Badge variant="outline" className="text-primary border-primary text-base py-1 px-3">
                    {property.price} ETH
                  </Badge>
                </div>
              </div>
              
              
              
              <div>
                <h2 className="text-lg font-semibold mb-2">Описание</h2>
                <p className="text-gray-700">{property.description}</p>
              </div>
              
              {property.documents && <div className="mt-4">
                  <h2 className="text-lg font-semibold mb-2">Документы</h2>
                  <a href={property.documents} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:text-primary/80">
                    <FileText className="h-5 w-5 mr-2" />
                    <span>Просмотреть документы</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </div>}
            </div>
            
            {/* Transaction history */}
            {transactions.length > 0 && <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">История транзакций</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.map(tx => <div key={tx.id} className="p-3 border rounded-md bg-gray-50">
                        <div className="flex justify-between mb-1">
                          <div className="text-sm text-gray-500">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {new Date(tx.timestamp * 1000).toLocaleDateString()}
                          </div>
                          <div>
                            <Badge variant="outline" className="text-primary border-primary">
                              {tx.price} ETH
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500">Продавец:</p>
                            <p className="text-sm font-medium truncate">
                              {tx.seller.substring(0, 8)}...{tx.seller.substring(tx.seller.length - 6)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Покупатель:</p>
                            <p className="text-sm font-medium truncate">
                              {tx.buyer.substring(0, 8)}...{tx.buyer.substring(tx.buyer.length - 6)}
                            </p>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </CardContent>
              </Card>}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Связаться с продавцом</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Владелец</p>
                    <p className="text-sm text-gray-500 truncate">{owner?.substring(0, 8)}...{owner?.substring((owner?.length || 0) - 6)}</p>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline" onClick={() => toast.info('Функция связи с продавцом будет доступна в следующей версии')}>
                  Написать сообщение
                </Button>
              </CardContent>
            </Card>
            
            {!property.isSold && isConnected && <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Купить недвижимость</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sign ECP button */}
                    {!isECPSigned ? <div className="space-y-2">
                        <Button variant="outline" className="w-full" onClick={handleSignECP} disabled={isSigningECP}>
                          {isSigningECP ? <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Подписание...
                            </> : <>Подписать ЭЦП</>}
                        </Button>
                        <p className="text-xs text-gray-500">
                          Перед покупкой необходимо подписать ЭЦП
                        </p>
                      </div> : <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-green-700">ЭЦП успешно подписан</span>
                      </div>}
                    
                    {/* Buy button */}
                    <div>
                      <Button className="w-full" disabled={!isECPSigned || isPurchasing || account === owner} onClick={handleBuyProperty}>
                        {isPurchasing ? <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Выполнение транзакции...
                          </> : <>Купить за {property.price} ETH</>}
                      </Button>
                      
                      {account === owner && <p className="text-xs text-gray-500 mt-2 text-center">
                          Вы не можете купить свою собственную недвижимость
                        </p>}
                    </div>
                  </div>
                </CardContent>
              </Card>}
            
            {!isConnected && !property.isSold && <Card>
                <CardContent className="pt-6">
                  <p className="text-center mb-4">Для покупки необходимо подключить кошелек</p>
                  <Button onClick={() => navigate('/')} className="w-full">
                    Подключить MetaMask
                  </Button>
                </CardContent>
              </Card>}
          </div>
        </div>
      </div>
    </MainLayout>;
};
export default PropertyDetailPage;