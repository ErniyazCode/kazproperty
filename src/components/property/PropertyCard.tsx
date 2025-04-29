
import { Link } from 'react-router-dom';
import { MapPin, Bed, Square } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PropertyCardProps {
  id: number;
  title: string;
  location: string;
  price: number;
  rooms: number;
  squareMeters: number;
  imageUrl: string;
  isSold: boolean;
}

const PropertyCard = ({
  id,
  title,
  location,
  price,
  rooms,
  squareMeters,
  imageUrl,
  isSold
}: PropertyCardProps) => {
  return (
    <Link to={`/property/${id}`}>
      <Card className="overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={imageUrl || '/placeholder.svg'}
            alt={title}
            className="h-full w-full object-cover"
          />
          {isSold && (
            <div className="absolute top-0 right-0 left-0 bg-destructive bg-opacity-80 text-white py-1 px-3">
              <p className="text-center font-semibold">ПРОДАНО</p>
            </div>
          )}
        </div>
        <CardContent className="pt-4">
          <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
          <div className="flex items-center text-gray-500 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm line-clamp-1">{location}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-gray-500">
              <Bed className="h-4 w-4 mr-1" />
              <span className="text-sm">{rooms} комн.</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Square className="h-4 w-4 mr-1" />
              <span className="text-sm">{squareMeters} м²</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Badge variant="outline" className="text-primary border-primary">
            {price} ETH
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PropertyCard;
