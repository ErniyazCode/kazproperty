
import axios from 'axios';
import config from '@/config/config';

const JWT = config.PINATA.JWT;

class PinataService {
  // Upload file to IPFS using Pinata
  async uploadFile(file: File) {
    try {
      console.log('Starting file upload to Pinata with JWT:', JWT ? 'JWT exists' : 'JWT missing');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Send request to Pinata
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'Authorization': `Bearer ${JWT}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Pinata upload response:', res.data);
      
      return {
        success: true,
        ipfsHash: res.data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`
      };
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      return {
        success: false,
        error: 'Failed to upload file'
      };
    }
  }
  
  // Upload multiple files to IPFS
  async uploadMultipleFiles(files: File[]) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file));
      const results = await Promise.all(uploadPromises);
      
      return {
        success: true,
        files: results
      };
    } catch (error) {
      console.error('Error uploading multiple files to Pinata:', error);
      return {
        success: false,
        error: 'Failed to upload multiple files'
      };
    }
  }
  
  // Upload JSON data to IPFS
  async uploadJSON(jsonData: any) {
    try {
      console.log('Starting JSON upload to Pinata with JWT:', JWT ? 'JWT exists' : 'JWT missing');
      
      const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', jsonData, {
        headers: {
          'Authorization': `Bearer ${JWT}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Pinata JSON upload response:', res.data);
      
      return {
        success: true,
        ipfsHash: res.data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`
      };
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      return {
        success: false,
        error: 'Failed to upload JSON'
      };
    }
  }
}

export default new PinataService();
