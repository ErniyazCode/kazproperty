
// This file contains configuration settings for the application
// Replace CONTRACT_ADDRESS with the deployed contract address after deployment

const config = {
  // Contract address (to be filled after deployment)
  CONTRACT_ADDRESS: "0x3ecE53e006EF989893E4f58A40d3751C0693C145", // Replace with actual contract address after deployment
  
  // Pinata configuration
  PINATA: {
    API_KEY: "edb61497fb1f4f2a682b",
    API_SECRET: "a8d3e83719a2be73fe3b11f09e387b592ac6f94fb7252a89629c2be97e2411a9",
    JWT: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhNTQ3ZTk3Yi01OWYyLTQ5NzctYjczOC0xZjhlZWFmYzU1Y2MiLCJlbWFpbCI6ImVybmk4NjI3OEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZWRiNjE0OTdmYjFmNGYyYTY4MmIiLCJzY29wZWRLZXlTZWNyZXQiOiJhOGQzZTgzNzE5YTJiZTczZmUzYjExZjA5ZTM4N2I1OTJhYzZmOTRmYjcyNTJhODk2MjljMmJlOTdlMjQxMWE5IiwiZXhwIjoxNzc2OTUyMDMxfQ.nzBGrdYyLDmaX110XfE9b0kcykeiMsNgXtSybBQwkgM"
  },
  
  // MongoDB configuration
  MONGODB: {
    URI: "mongodb+srv://erni86278:xRGDL3.3z4NvtY6@cluster0.gs5pftz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    DB_NAME: "RealEstate",
    COLLECTIONS: ['admins', 'properties', 'transactions', 'users']
  },
  
  // Admin credentials
  ADMIN: {
    USERNAME: "admin",
    PASSWORD: "admin"
  },
  
  // Kazakhstan cities for filtering
  CITIES: [
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
    "Кызылорда",
    "Уральск",
    "Актау",
    "Петропавловск",
    "Талдыкорган",
    "Кокшетау",
    "Туркестан"
  ]
};

export default config;
