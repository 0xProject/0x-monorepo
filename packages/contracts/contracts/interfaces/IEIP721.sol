pragma solidity ^0.4.19;

import 'IEIP20Optional.sol';

// https://github.com/ethereum/EIPs/issues/821
contract IEIP821 is IEIP20Optional {
    
    bytes4 constant INTERFACE_ID =
        IEIP20Optional.INTERFACE_ID ^
        bytes4(keccak256('isERC821()')) ^
        bytes4(keccak256('totalSupply()')) ^
        bytes4(keccak256('balanceOf(address)')) ^
        bytes4(keccak256('transfer(address,uint256,bytes)')) ^
        bytes4(keccak256('approve(address,uint256,bytes)')) ^
        bytes4(keccak256('transferFrom(address,address,uint256,bytes)'));
    
    function IEIP821()
        public
    {
        supportsInterface[INTERFACE_ID] = true;
    }
    
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed assetId,
        address operator,
        bytes userData,
        bytes operatorData
    );
    event Update(
        uint256 indexed assetId,
        address indexed owner,
        address indexed operator,
        string data
    );
    event AuthorizeOperator(
        address indexed operator,
        address indexed owner,
        bool authorized
    );
    
    function description()
        public view
        returns (string);
    
    function totalSupply()
        public view
        returns (uint256);
    
    function isERC821()
        public pure
        returns (bool)
    {
        return true;
    }

    function exists(uint256 assetId)
        public view
        returns (bool);
    
    function ownerOf(uint256 assetId)
        public view
        returns (address);
    
    function safeOwnerOfOf(uint256 assetId)
        public view
        returns (address);
    
    function assetData(uint256 assetId)
        public view
        returns (string);
    
    function safeAssetData(uint256 assetId)
        public view
        returns (string);

    function balanceOf(address owner)
        public view
        returns (uint256);
    
    function assetCount(address owner)
        public view
        returns (uint256);
    
    function assetByIndex(address owner, uint256 index)
        public view
        returns (uint256);
    
    function assetsOf(address owner)
        external view
        returns (uint256[]);
    
    function isOperatorAuthorizedFor(address operator, address assetOwner)
        public view
        returns (bool);

    function transfer(
        address to,
        uint256 assetId,
        bytes userData,
        bytes operatorData)
        public;
        
    function transfer(address to, uint256 assetId, bytes userData)
        public;
        
    function transfer(address to, uint256 assetId)
        public;

    function authorizeOperator(address operator, bool authorized)
        public;
}
