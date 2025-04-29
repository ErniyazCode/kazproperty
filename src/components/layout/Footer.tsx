
import { Building, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-100 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Building className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-semibold text-gray-800">KazProperty</span>
            </div>
            <p className="text-gray-600 mb-4">
              Ведущая платформа для покупки и продажи недвижимости с использованием блокчейн-технологий в Казахстане.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Быстрые ссылки</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary">Главная</Link>
              </li>
              <li>
                <Link to="/properties" className="text-gray-600 hover:text-primary">Недвижимость</Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-600 hover:text-primary">Профиль</Link>
              </li>
              <li>
                <Link to="/add-property" className="text-gray-600 hover:text-primary">Добавить объявление</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Города</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/properties?location=Алматы" className="text-gray-600 hover:text-primary">Алматы</Link>
              </li>
              <li>
                <Link to="/properties?location=Астана" className="text-gray-600 hover:text-primary">Астана</Link>
              </li>
              <li>
                <Link to="/properties?location=Шымкент" className="text-gray-600 hover:text-primary">Шымкент</Link>
              </li>
              <li>
                <Link to="/properties?location=Караганды" className="text-gray-600 hover:text-primary">Караганды</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Контакты</h4>
            <p className="text-gray-600 mb-2">г. Астана, ул. Республика 7</p>
            <p className="text-gray-600 mb-2">info@erni.kz</p>
            <p className="text-gray-600">+7 (777) 123-45-67</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} KazProperty. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
