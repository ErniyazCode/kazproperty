
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RealEstate {
    address public admin;
    
    struct User {
        string name;
        string kycDocument;
        bool isVerified;
        bool hasSignedECP;
    }
    
    struct Property {
        uint256 id;
        address owner;
        string title;
        string description;
        string location;
        uint256 price;
        uint256 roomCount;
        uint256 squareMeters;
        string[] images;
        string documents;
        bool isApproved;
        bool isSold;
    }
    
    struct Transaction {
        uint256 id;
        uint256 propertyId;
        address seller;
        address buyer;
        uint256 price;
        uint256 timestamp;
    }
    
    mapping(address => User) public users;
    mapping(uint256 => Property) public properties;
    mapping(uint256 => Transaction) public transactions;
    
    uint256 public propertyCounter;
    uint256 public transactionCounter;
    
    event UserRegistered(address indexed userAddress, string name);
    event UserVerified(address indexed userAddress);
    event ECPSigned(address indexed userAddress);
    event PropertyListed(uint256 indexed propertyId, address indexed owner);
    event PropertyApproved(uint256 indexed propertyId);
    event PropertySold(uint256 indexed propertyId, address indexed seller, address indexed buyer, uint256 price);
    
    constructor() {
        admin = msg.sender;
        
        // Auto-verify admin
        users[admin].isVerified = true;
        users[admin].hasSignedECP = true;
        users[admin].name = "Admin";
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyVerified() {
        require(users[msg.sender].isVerified, "User not verified");
        _;
    }
    
    modifier onlyECPSigned() {
        require(users[msg.sender].hasSignedECP, "User has not signed ECP");
        _;
    }
    
    function registerUser(string memory _name, string memory _kycDocument) public {
        User storage user = users[msg.sender];
        user.name = _name;
        user.kycDocument = _kycDocument;
        
        emit UserRegistered(msg.sender, _name);
    }
    
    function verifyUser(address _userAddress) public onlyAdmin {
        users[_userAddress].isVerified = true;
        
        emit UserVerified(_userAddress);
    }
    
    function signECP() public {
        users[msg.sender].hasSignedECP = true;
        
        emit ECPSigned(msg.sender);
    }
    
    function listProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        uint256 _price,
        uint256 _roomCount,
        uint256 _squareMeters,
        string[] memory _images,
        string memory _documents
    ) public onlyVerified onlyECPSigned {
        propertyCounter++;
        
        Property storage property = properties[propertyCounter];
        property.id = propertyCounter;
        property.owner = msg.sender;
        property.title = _title;
        property.description = _description;
        property.location = _location;
        property.price = _price;
        property.roomCount = _roomCount;
        property.squareMeters = _squareMeters;
        property.images = _images;
        property.documents = _documents;
        
        emit PropertyListed(propertyCounter, msg.sender);
    }
    
    function approveProperty(uint256 _propertyId) public onlyAdmin {
        properties[_propertyId].isApproved = true;
        
        emit PropertyApproved(_propertyId);
    }
    
    function buyProperty(uint256 _propertyId) public payable onlyVerified onlyECPSigned {
        Property storage property = properties[_propertyId];
        
        require(property.isApproved, "Property not approved");
        require(!property.isSold, "Property already sold");
        require(msg.sender != property.owner, "Cannot buy own property");
        require(msg.value >= property.price, "Insufficient payment");
        
        address seller = property.owner;
        
        // Transfer ownership
        property.isSold = true;
        
        transactionCounter++;
        Transaction storage transaction = transactions[transactionCounter];
        transaction.id = transactionCounter;
        transaction.propertyId = _propertyId;
        transaction.seller = seller;
        transaction.buyer = msg.sender;
        transaction.price = property.price;
        transaction.timestamp = block.timestamp;
        
        payable(seller).transfer(property.price);
        
        if (msg.value > property.price) {
            payable(msg.sender).transfer(msg.value - property.price);
        }
        
        emit PropertySold(_propertyId, seller, msg.sender, property.price);
    }
    
    function getPropertyCount() public view returns (uint256) {
        return propertyCounter;
    }
    
    function getTransactionCount() public view returns (uint256) {
        return transactionCounter;
    }
    
    function getUserProperties(address _userAddress) public view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= propertyCounter; i++) {
            if (properties[i].owner == _userAddress) {
                count++;
            }
        }
        
        uint256[] memory userProperties = new uint256[](count);
        count = 0;
        
        for (uint256 i = 1; i <= propertyCounter; i++) {
            if (properties[i].owner == _userAddress) {
                userProperties[count] = i;
                count++;
            }
        }
        
        return userProperties;
    }
    
    function getPropertyTransactions(uint256 _propertyId) public view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= transactionCounter; i++) {
            if (transactions[i].propertyId == _propertyId) {
                count++;
            }
        }
        
        uint256[] memory propertyTransactions = new uint256[](count);
        count = 0;
        
        for (uint256 i = 1; i <= transactionCounter; i++) {
            if (transactions[i].propertyId == _propertyId) {
                propertyTransactions[count] = i;
                count++;
            }
        }
        
        return propertyTransactions;
    }
}
