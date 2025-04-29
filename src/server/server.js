const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`Response status: ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  next();
});

const dbUri = 'mongodb+srv://erni:xRGDL3.3z4NvtY6@cluster0.gs5pftz.mongodb.net/RealEstate?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbUri)
  .then(() => {
    console.log('Успешно подключено к базе данных RealEstate!');
  })
  .catch((error) => {
    console.error('Ошибка подключения:', error);
  });

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  email: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});

const propertySchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  location: String,
  price: Number,
  roomCount: Number,
  squareMeters: Number,
  images: [String],
  documents: String,
  owner: String,
  isApproved: { type: Boolean, default: false },
  isSold: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  id: Number,
  propertyId: Number,
  seller: String,
  buyer: String,
  price: Number,
  transactionHash: String,
  timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  address: { type: String, unique: true },
  name: String,
  isVerified: { type: Boolean, default: false },
  kycDocument: String,
  hasSignedECP: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);
const Property = mongoose.model('Property', propertySchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const User = mongoose.model('User', userSchema);

app.get('/api/health', async (req, res) => {
  try {
    console.log('Health check endpoint called');
    res.json({ status: 'OK', message: 'Server is running and connected to MongoDB' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Server error during health check' });
  }
});


app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching all users');
    const users = await User.find({});
    
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { address, name } = req.body;
    console.log('Creating user:', { address, name });
    
    const existingUser = await User.findOne({ address });
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.json(existingUser);
    }
    
    const newUser = new User({
      address,
      name,
      isVerified: false,
      kycDocument: '',
      hasSignedECP: false
    });
    
    await newUser.save();
    console.log('User created:', newUser._id);
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/users/:address', async (req, res) => {
  try {
    const { address } = req.params;
    console.log('Fetching user:', address);
    const user = await User.findOne({ 
      address: new RegExp('^' + address.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') 
    });
    if (!user) {
      console.log('User not found:', address);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User found:', user);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/users/:address/kyc', async (req, res) => {
  try {
    const { address } = req.params;
    const { kycDocument } = req.body;
    
    console.log('Updating KYC document for:', address, kycDocument);
    
    const result = await User.updateOne(
      { address: new RegExp('^' + address.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      { $set: { kycDocument } }
    );
    
    if (result.matchedCount === 0) {
      // Create user if not found
      const newUser = new User({
        address,
        name: `User ${address.substring(0, 6)}`,
        kycDocument
      });
      await newUser.save();
      console.log('New user created with KYC document:', newUser);
      return res.json({ message: 'New user created with KYC document' });
    }
    
    console.log('KYC document updated:', result);
    res.json({ message: 'KYC document updated successfully' });
  } catch (error) {
    console.error('Error updating KYC document:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/users/:address/verify', async (req, res) => {
  try {
    const { address } = req.params;
    console.log('Verifying user:', address);
    
    const result = await User.updateOne(
      { address: new RegExp('^' + address.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      { $set: { isVerified: true } }
    );
    
    if (result.matchedCount === 0) {
      console.log('User not found for verification:', address);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User verified:', result);
    res.json({ message: 'User verified successfully' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/users/:address/ecp', async (req, res) => {
  try {
    const { address } = req.params;
    console.log('Setting ECP signed for user:', address);
    
    const result = await User.updateOne(
      { address: new RegExp('^' + address.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      { $set: { hasSignedECP: true } }
    );
    
    if (result.matchedCount === 0) {
      // Create user if not found
      const newUser = new User({
        address,
        name: `User ${address.substring(0, 6)}`,
        hasSignedECP: true
      });
      await newUser.save();
      console.log('New user created with ECP signed:', newUser);
      return res.json({ message: 'New user created with ECP signed' });
    }
    
    console.log('ECP signed successfully:', result);
    res.json({ message: 'ECP signed successfully' });
  } catch (error) {
    console.error('Error signing ECP:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/properties', async (req, res) => {
  try {
    console.log('Fetching all properties');
    const properties = await Property.find({});
    
    console.log(`Found ${properties.length} properties`);
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching property with id: ${id}`);
    
    const property = await Property.findOne({ id: Number(id) });
    
    if (!property) {
      console.log(`Property with id ${id} not found`);
      return res.status(404).json({ error: 'Property not found' });
    }
    
    console.log('Property found:', property);
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const property = req.body;
    console.log('Creating property:', property);
    
    const lastProperty = await Property.findOne().sort({ id: -1 });
    const newId = lastProperty ? lastProperty.id + 1 : 1;
    
    const newProperty = new Property({
      ...property,
      id: newId,
      isApproved: false,
      isSold: false
    });
    
    await newProperty.save();
    console.log('Property created:', newProperty._id);
    res.status(201).json({ message: 'Property created successfully', property: newProperty });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/properties/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Approving property:', id);
    
    const result = await Property.updateOne(
      { id: Number(id) },
      { $set: { isApproved: true } }
    );
    
    if (result.matchedCount === 0) {
      console.log('Property not found for approval:', id);
      return res.status(404).json({ error: 'Property not found' });
    }
    
    console.log('Property approved:', result);
    res.json({ message: 'Property approved successfully' });
  } catch (error) {
    console.error('Error approving property:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/properties/:id/sell', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer, transactionHash } = req.body;
    console.log('Marking property as sold:', { id, buyer, transactionHash });
    
    const property = await Property.findOne({ id: Number(id) });
    
    if (!property) {
      console.log('Property not found for sale:', id);
      return res.status(404).json({ error: 'Property not found' });
    }
    
    await Property.updateOne(
      { id: Number(id) },
      { $set: { isSold: true } }
    );
    
    const lastTransaction = await Transaction.findOne().sort({ id: -1 });
    const newTransactionId = lastTransaction ? lastTransaction.id + 1 : 1;
    
    const transaction = new Transaction({
      id: newTransactionId,
      propertyId: Number(id),
      seller: property.owner,
      buyer,
      price: property.price,
      transactionHash
    });
    
    await transaction.save();
    
    console.log('Property sold successfully:', { propertyId: id, transactionId: transaction._id });
    res.json({ message: 'Property sold successfully' });
  } catch (error) {
    console.error('Error selling property:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/properties/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching transactions for property: ${id}`);
    
    const transactions = await Transaction.find({ propertyId: Number(id) });
    
    console.log(`Found ${transactions.length} transactions for property ${id}`);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching property transactions:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Admin login attempt:', username);
    
    const admin = await Admin.findOne({ username, password });
    
    if (!admin) {
      console.log('Invalid admin credentials:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('Admin login successful:', username);
    res.json({ message: 'Login successful', admin });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

async function initializeData() {
  try {
    // Create default admin if it doesn't exist
    const adminExists = await Admin.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const defaultAdmin = new Admin({
        username: 'admin',
        password: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'Admin'
      });
      
      await defaultAdmin.save();
      console.log('Default admin created');
    }
    
    const propertyCount = await Property.countDocuments();
    
    if (propertyCount === 0) {
      console.log('Adding sample properties to database...');
      
      const sampleProperties = [
        {
          id: 1,
          title: '3-комнатная квартира в ЖК "Премиум"',
          description: 'Шикарная квартира в центре города с видом на парк. Полностью меблированная, с новым ремонтом.',
          location: 'Алматы',
          price: 5.2,
          roomCount: 3,
          squareMeters: 85,
          images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1170&q=80'],
          owner: '0xE224597F4D54bA16E38308468280Ef0E7a2F76cA',
          isApproved: true,
          isSold: false
        },
        {
          id: 2,
          title: '2-комнатная квартира с видом на горы',
          description: 'Современная квартира с панорамными окнами и видом на горы.',
          location: 'Астана',
          price: 3.8,
          roomCount: 2,
          squareMeters: 65,
          images: ['https://images.unsplash.com/photo-1565182999561-f4f795d8710d?auto=format&fit=crop&w=1170&q=80'],
          owner: '0x1234567890123456789012345678901234567890',
          isApproved: true,
          isSold: false
        },
        {
          id: 3,
          title: 'Студия в центре города',
          description: 'Уютная студия в центре города с современным ремонтом.',
          location: 'Шымкент',
          price: 2.5,
          roomCount: 1,
          squareMeters: 45,
          images: ['https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1170&q=80'],
          owner: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
          isApproved: false,
          isSold: false
        }
      ];
      
      await Property.insertMany(sampleProperties);
      console.log('Sample properties added');
    }
    
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('Adding sample users to database...');
      
      const sampleUsers = [
        {
          address: '0xE224597F4D54bA16E38308468280Ef0E7a2F76cA',
          name: 'Александр Петров',
          isVerified: true,
          kycDocument: 'https://gateway.pinata.cloud/ipfs/QmNjk1zzw2mkkBNk7qcXp9vL4JeBBC3RpZu5LMsmF7DdeN',
          hasSignedECP: true
        },
        {
          address: '0x1234567890123456789012345678901234567890',
          name: 'Елена Иванова',
          isVerified: true,
          kycDocument: 'https://ipfs.io/ipfs/QmZ4j1xQ3rwZsEKXhFwqxBnDJGfAq1Tb4DMHnYZd3kBM5a',
          hasSignedECP: true
        },
        {
          address: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
          name: 'Михаил Сидоров',
          isVerified: false,
          kycDocument: '',
          hasSignedECP: false
        }
      ];
      
      await User.insertMany(sampleUsers);
      console.log('Sample users added');
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeData();
});

module.exports = app;
