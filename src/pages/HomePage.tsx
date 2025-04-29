
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building, Shield, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import { useWeb3 } from '@/contexts/Web3Context';
import PropertyCard from '@/components/property/PropertyCard';
import config from '@/config/config';

const featuredProperties = [
  {
    id: 1,
    title: '3-комнатная квартира в ЖК "Премиум"',
    location: 'Алматы',
    price: 5.2,
    rooms: 3,
    squareMeters: 85,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    isSold: false
  },
  {
    id: 2,
    title: '2-комнатная квартира с видом на горы',
    location: 'Астана',
    price: 3.8,
    rooms: 2,
    squareMeters: 65,
    imageUrl: 'https://images.unsplash.com/photo-1565182999561-f4f795d8710d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    isSold: false
  },
  {
    id: 3,
    title: 'Студия в центре города',
    location: 'Шымкент',
    price: 2.5,
    rooms: 1,
    squareMeters: 45,
    imageUrl: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    isSold: false
  }
];

const HomePage = () => {
  const { isConnected } = useWeb3();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/90 to-primary text-white py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Недвижимость на блокчейне
            </h1>
            <p className="text-lg mb-8 opacity-90">
              Безопасные сделки с недвижимостью через смарт-контракты. Покупайте и продавайте недвижимость в Казахстане с помощью криптовалюты.
            </p>
            <div className="flex space-x-4">
              <Button 
                size="lg" 
                asChild
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link to="/properties">
                  Смотреть объявления
                </Link>
              </Button>
              {isConnected && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="border-white text-white hover:bg-white/20"
                >
                  <Link to="/add-property">
                    Добавить объявление
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80"
              alt="Modern building"
              className="rounded-lg shadow-lg max-w-full"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Регистрация и проверка</h3>
                <p className="text-gray-600">
                  Подключите MetaMask кошелек, заполните профиль и пройдите верификацию личности для обеспечения безопасности сделок.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Листинг или поиск</h3>
                <p className="text-gray-600">
                  Разместите объявление о продаже недвижимости или просмотрите существующие объявления с помощью удобных фильтров.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Подписание и оплата</h3>
                <p className="text-gray-600">
                  Подпишите ЭЦП и совершите безопасную транзакцию через смарт-контракт для покупки недвижимости с использованием ETH.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Избранные объявления</h2>
            <Button variant="outline" asChild>
              <Link to="/properties" className="flex items-center">
                Все объявления
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
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
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Популярные города</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.CITIES.slice(0, 8).map((city) => (
              <Link
                key={city}
                to={`/properties?location=${city}`}
                className="relative overflow-hidden rounded-lg h-40 group"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <img
                  src={`https://source.unsplash.com/featured/?city,${city.toLowerCase()}`}
                  alt={city}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <span className="absolute bottom-4 left-4 text-white font-semibold text-lg z-20">
                  {city}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage;
