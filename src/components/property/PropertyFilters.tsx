
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PropertyFiltersProps {
  onFilterChange: (filters: any) => void;
}

const kazakhstanCities = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганды",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Атырау",
  "Костанай",
  "Актау",
  "Уральск",
  "Петропавловск",
  "Кызылорда",
  "Темиртау",
  "Кокшетау"
];

const PropertyFilters = ({ onFilterChange }: PropertyFiltersProps) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10]);
  const [squareMetersRange, setSquareMetersRange] = useState<[number, number]>([0, 200]);
  const [roomCount, setRoomCount] = useState<number | undefined>(undefined);
  
  const handleLocationChange = (value: string) => {
    setLocation(value);
    onFilterChange({ location: value });
    
    // Update URL query params
    const searchParams = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      searchParams.set('location', value);
    } else {
      searchParams.delete('location');
    }
    
    navigate({
      pathname: '/properties',
      search: searchParams.toString()
    });
  };
  
  const handlePriceChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setPriceRange(range);
    onFilterChange({ priceRange: range });
  };
  
  const handleSquareMetersChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setSquareMetersRange(range);
    onFilterChange({ squareMetersRange: range });
  };
  
  const handleRoomCountChange = (value: string) => {
    const numValue = value === "all" ? undefined : parseInt(value);
    setRoomCount(numValue);
    onFilterChange({ roomCount: numValue });
  };
  
  const handleResetFilters = () => {
    setLocation('');
    setPriceRange([0, 10]);
    setSquareMetersRange([0, 200]);
    setRoomCount(undefined);
    
    onFilterChange({
      location: '',
      priceRange: [0, 10],
      squareMetersRange: [0, 200],
      roomCount: undefined
    });
    
    navigate('/properties');
  };
  
  // Parse query params on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const locationParam = searchParams.get('location');
    
    if (locationParam) {
      setLocation(locationParam);
      onFilterChange({ location: locationParam });
    }
  }, []);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">Фильтры поиска</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Город
          </label>
          <Select value={location} onValueChange={handleLocationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите город" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все города</SelectItem>
              {kazakhstanCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1">
            Количество комнат
          </label>
          <Select
            value={roomCount?.toString() || "all"}
            onValueChange={handleRoomCountChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любое</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цена (ETH): {priceRange[0]} - {priceRange[1]}
          </label>
          <div className="pt-6 px-2">
            <Slider
              defaultValue={[0, 10]}
              max={10}
              step={0.1}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={handlePriceChange}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Площадь (м²): {squareMetersRange[0]} - {squareMetersRange[1]}
          </label>
          <div className="pt-6 px-2">
            <Slider
              defaultValue={[0, 200]}
              max={200}
              step={5}
              value={[squareMetersRange[0], squareMetersRange[1]]}
              onValueChange={handleSquareMetersChange}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleResetFilters}
          className="mr-2"
        >
          Сбросить
        </Button>
      </div>
    </div>
  );
};

export default PropertyFilters;
