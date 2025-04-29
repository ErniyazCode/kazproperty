
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PropertyFilters from '@/components/property/PropertyFilters';
import PropertyCard from '@/components/property/PropertyCard';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';
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

const PropertiesPage = () => {
  const location = useLocation();
  const { contract } = useWeb3();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    location: '',
    priceRange: [0, 10] as [number, number],
    squareMetersRange: [0, 200] as [number, number],
    roomCount: undefined as number | undefined,
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const locationParam = queryParams.get('location');
    
    if (locationParam) {
      setFilters(prevFilters => ({
        ...prevFilters,
        location: locationParam
      }));
    }
  }, [location.search]);

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      
      try {
        // Attempt to load from local API first (if server is running)
        try {
          console.log('Attempting to load properties from API...');
          const response = await axios.get('http://localhost:5000/api/properties', { timeout: 3000 });
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log('Properties loaded from API:', response.data.length);
            const propertiesArray = response.data.map((property: any) => ({
              id: property.id,
              title: property.title,
              location: property.location,
              price: property.price,
              rooms: property.roomCount,
              squareMeters: property.squareMeters,
              imageUrl: Array.isArray(property.images) && property.images.length > 0 
                ? property.images[0] 
                : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80',
              isSold: property.isSold
            }));
            
            setProperties(propertiesArray);
            applyFilters(propertiesArray, filters);
            setIsLoading(false);
            return;
          }
        } catch (apiError: any) {
          console.error('Error loading properties from API:', apiError.message || apiError);
        }
        
        // Fall back to blockchain if available
        if (contract) {
          try {
            console.log('Attempting to load properties from contract...');
            const propertyCount = await contract.methods.getPropertyCount().call();
            console.log('Property count from contract:', propertyCount);
            
            const propertiesArray: Property[] = [];
            
            for (let i = 1; i <= propertyCount; i++) {
              try {
                const property = await contract.methods.properties(i).call();
                
                // Show all properties, not just approved ones
                propertiesArray.push({
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
                });
              } catch (propertyError) {
                console.error(`Error loading property ${i}:`, propertyError);
              }
            }
            
            if (propertiesArray.length > 0) {
              console.log('Properties loaded from contract:', propertiesArray.length);
              setProperties(propertiesArray);
              applyFilters(propertiesArray, filters);
              setIsLoading(false);
              return;
            }
          } catch (contractError) {
            console.error('Error loading properties from contract:', contractError);
          }
        }
        
        console.log('Using mock data for preview');
        loadMockProperties();
      } catch (error: any) {
        console.error('General error loading properties:', error.message || error);
        loadMockProperties();
      }
    };
    
    const loadMockProperties = () => {
      const mockProperties = [
        {
          id: 1,
          title: '3-комнатная квартира в ЖК "Премиум"',
          location: 'Алматы',
          price: 5.2,
          rooms: 3,
          squareMeters: 85,
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1170&q=80',
          isSold: false
        },
        {
          id: 2,
          title: '2-комнатная квартира с видом на горы',
          location: 'Астана',
          price: 3.8,
          rooms: 2,
          squareMeters: 65,
          imageUrl: 'https://images.unsplash.com/photo-1565182999561-f4f795d8710d?auto=format&fit=crop&w=1170&q=80',
          isSold: false
        },
        {
          id: 3,
          title: 'Студия в центре города',
          location: 'Шымкент',
          price: 2.5,
          rooms: 1,
          squareMeters: 45,
          imageUrl: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1170&q=80',
          isSold: false
        },
        {
          id: 4,
          title: 'Пентхаус с террасой',
          location: 'Алматы',
          price: 8.1,
          rooms: 4,
          squareMeters: 150,
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1170&q=80',
          isSold: true
        },
        {
          id: 5,
          title: 'Уютная квартира возле набережной',
          location: 'Актау',
          price: 3.2,
          rooms: 2,
          squareMeters: 60,
          imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1170&q=80',
          isSold: false
        },
        {
          id: 6,
          title: '1-комнатная квартира в новостройке',
          location: 'Караганды',
          price: 1.8,
          rooms: 1,
          squareMeters: 40,
          imageUrl: 'https://images.unsplash.com/photo-1533779283484-8ad4940aa3a8?auto=format&fit=crop&w=1170&q=80',
          isSold: false
        }
      ];
      
      setProperties(mockProperties);
      applyFilters(mockProperties, filters);
      setIsLoading(false);
    };
    
    loadProperties();
  }, [contract]);

  const applyFilters = (properties: Property[], filters: any) => {
    console.log('Applying filters:', filters);
    const filtered = properties.filter(property => {
      if (filters.location && filters.location !== "all" && property.location !== filters.location) {
        return false;
      }
      
      if (
        property.price < filters.priceRange[0] ||
        property.price > filters.priceRange[1]
      ) {
        return false;
      }
      
      if (
        property.squareMeters < filters.squareMetersRange[0] ||
        property.squareMeters > filters.squareMetersRange[1]
      ) {
        return false;
      }
      
      if (filters.roomCount && property.rooms !== filters.roomCount) {
        return false;
      }
      
      return true;
    });
    
    console.log('Filtered properties:', filtered);
    setFilteredProperties(filtered);
  };

  const handleFilterChange = (newFilters: any) => {
    console.log('Filter change:', newFilters);
    const updatedFilters = {
      ...filters,
      ...newFilters,
    };
    
    setFilters(updatedFilters);
    applyFilters(properties, updatedFilters);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Объекты недвижимости</h1>
        
        <PropertyFilters onFilterChange={handleFilterChange} />
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Нет объявлений по заданным критериям</h3>
            <p className="mt-2 text-gray-500">Попробуйте изменить параметры фильтра</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
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
        )}
      </div>
    </MainLayout>
  );
};

export default PropertiesPage;
