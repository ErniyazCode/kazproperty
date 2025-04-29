import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Upload, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWeb3 } from '@/contexts/Web3Context';
import PinataService from '@/services/PinataService';
import config from '@/config/config';

interface PropertyFormValues {
  title: string;
  description: string;
  location: string;
  price: string;
  roomCount: string;
  squareMeters: string;
}

const PropertyForm = () => {
  const navigate = useNavigate();
  const { account, contract, web3 } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const form = useForm<PropertyFormValues>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      price: '',
      roomCount: '',
      squareMeters: '',
    },
  });
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      if (images.length + filesArray.length > 5) {
        toast.error('Максимальное количество изображений: 5');
        return;
      }
      
      setImages(prevImages => [...prevImages, ...filesArray]);
      
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    }
  };
  
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments(e.target.files[0]);
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };
  
  const onSubmit = async (data: PropertyFormValues) => {
    if (!account) {
      toast.error('Пожалуйста, подключите MetaMask');
      return;
    }
    
    if (images.length === 0) {
      toast.error('Пожалуйста, загрузите хотя бы одно изображение');
      return;
    }
    
    if (!documents) {
      toast.error('Пожалуйста, загрузите документы');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images to Pinata
      toast.info('Загрузка изображений...');
      const imageUploadResults = await PinataService.uploadMultipleFiles(images);
      
      if (!imageUploadResults.success) {
        throw new Error('Failed to upload images');
      }
      
      // Upload documents to Pinata
      toast.info('Загрузка документов...');
      const documentUploadResult = await PinataService.uploadFile(documents);
      
      if (!documentUploadResult.success) {
        throw new Error('Failed to upload documents');
      }
      
      const imageUrls = imageUploadResults.files
        .filter((result: any) => result.success)
        .map((result: any) => result.url);
      
      // Create property using smart contract
      toast.info('Подтвердите транзакцию в MetaMask...');
      
      if (contract && web3) {
        const priceInWei = web3.utils.toWei(data.price, 'ether');
        await contract.methods.listProperty(
          data.title,
          data.description,
          data.location,
          priceInWei,
          parseInt(data.roomCount),
          parseInt(data.squareMeters),
          imageUrls,
          documentUploadResult.url
        ).send({ 
          from: account
        });

        // POST to backend for MongoDB
        try {
          await fetch('http://localhost:5000/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.title,
              description: data.description,
              location: data.location,
              price: parseFloat(data.price),
              roomCount: parseInt(data.roomCount),
              squareMeters: parseInt(data.squareMeters),
              images: imageUrls,
              documents: documentUploadResult.url,
              owner: account
            })
          });
        } catch (err) {
          console.error('Ошибка при сохранении в MongoDB:', err);
        }
        
        toast.success('Объект недвижимости успешно добавлен!');
        navigate('/properties');
      } else {
        toast.error('Smart contract not initialized');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Произошла ошибка при добавлении объекта');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Добавить объект недвижимости</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Название обязательно' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название объявления</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: 3-комнатная квартира в центре" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              rules={{ required: 'Описание обязательно' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Подробное описание объекта недвижимости" 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                rules={{ required: 'Местоположение обязательно' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Город</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите город" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {config.CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                rules={{ 
                  required: 'Цена обязательна',
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: 'Введите корректную цену'
                  } 
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена (ETH)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Например: 1.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="roomCount"
                rules={{ required: 'Количество комнат обязательно' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество комнат</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите количество комнат" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 комната</SelectItem>
                        <SelectItem value="2">2 комнаты</SelectItem>
                        <SelectItem value="3">3 комнаты</SelectItem>
                        <SelectItem value="4">4 комнаты</SelectItem>
                        <SelectItem value="5">5+ комнат</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="squareMeters"
                rules={{ 
                  required: 'Площадь обязательна',
                  pattern: {
                    value: /^\d+$/,
                    message: 'Введите целое число'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Площадь (м²)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Например: 75" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-3">
              <FormLabel>Фотографии (до 5 изображений)</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative h-24 rounded-md overflow-hidden border border-gray-200">
                    <img src={url} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                    >
                      <X className="h-3 w-3 text-gray-700" />
                    </button>
                  </div>
                ))}
                
                {previewUrls.length < 5 && (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md border-gray-300 cursor-pointer">
                    <div className="flex flex-col items-center pt-5 pb-6">
                      <Plus className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-gray-500">Добавить</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <FormLabel>Документы</FormLabel>
              <div className="flex items-center justify-center w-full">
                <label
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="mb-1 text-sm text-gray-500">
                      <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
                    </p>
                    <p className="text-xs text-gray-500">PDF или DOC (макс. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {documents && (
                <div className="flex items-center justify-between p-2 bg-gray-50 border rounded-md">
                  <span className="text-sm truncate">{documents.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDocuments(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Добавление...' : 'Добавить объект недвижимости'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PropertyForm;
