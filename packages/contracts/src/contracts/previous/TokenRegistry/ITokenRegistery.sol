/*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.4.21;

import { IOwnable_v1 as IOwnable } from "../Ownable/IOwnable_v1.sol";

/// @title Token Registry - Stores metadata associated with ERC20 tokens. See ERC22 https://github.com/ethereum/EIPs/issues/22
/// @author Amir Bandeali - <amir@0xProject.com>, Will Warren - <will@0xProject.com>
contract ITokenRegistery is IOwnable {

    event LogAddToken(
        address indexed token,
        string name,
        string symbol,
        uint8 decimals,
        bytes ipfsHash,
        bytes swarmHash
    );

    event LogRemoveToken(
        address indexed token,
        string name,
        string symbol,
        uint8 decimals,
        bytes ipfsHash,
        bytes swarmHash
    );

    event LogTokenNameChange(
        address indexed token,
        string oldName,
        string newName
    );
    
    event LogTokenSymbolChange(
        address indexed token,
        string oldSymbol,
        string newSymbol
    );
    
    event LogTokenIpfsHashChange(
        address indexed token,
        bytes oldIpfsHash,
        bytes newIpfsHash
    );
    
    event LogTokenSwarmHashChange(
        address indexed token,
        bytes oldSwarmHash,
        bytes newSwarmHash
    );

    function tokens(address tokenAddress)
        public view
        returns (
            address token,
            string name,
            string symbol,
            uint8 decimals,
            bytes ipfsHash,
            bytes swarmHash
        );

    function tokenAddresses(uint256 index)
        public view
        returns (address);


    /// @dev Allows owner to add a new token to the registry.
    /// @param _token Address of new token.
    /// @param _name Name of new token.
    /// @param _symbol Symbol for new token.
    /// @param _decimals Number of decimals, divisibility of new token.
    /// @param _ipfsHash IPFS hash of token icon.
    /// @param _swarmHash Swarm hash of token icon.
    function addToken(
        address _token,
        string _name,
        string _symbol,
        uint8 _decimals,
        bytes _ipfsHash,
        bytes _swarmHash)
        public;
    
    /// @dev Allows owner to remove an existing token from the registry.
    /// @param _token Address of existing token.
    function removeToken(address _token, uint _index)
        public;

    /// @dev Allows owner to modify an existing token's name.
    /// @param _token Address of existing token.
    /// @param _name New name.
    function setTokenName(address _token, string _name)
        public;

    /// @dev Allows owner to modify an existing token's symbol.
    /// @param _token Address of existing token.
    /// @param _symbol New symbol.
    function setTokenSymbol(address _token, string _symbol)
        public;

    /// @dev Allows owner to modify an existing token's IPFS hash.
    /// @param _token Address of existing token.
    /// @param _ipfsHash New IPFS hash.
    function setTokenIpfsHash(address _token, bytes _ipfsHash)
        public;

    /// @dev Allows owner to modify an existing token's Swarm hash.
    /// @param _token Address of existing token.
    /// @param _swarmHash New Swarm hash.
    function setTokenSwarmHash(address _token, bytes _swarmHash)
        public;

    /*
     * Web3 call functions
     */

    /// @dev Provides a registered token's address when given the token symbol.
    /// @param _symbol Symbol of registered token.
    /// @return Token's address.
    function getTokenAddressBySymbol(string _symbol)
        public constant
        returns (address);

    /// @dev Provides a registered token's address when given the token name.
    /// @param _name Name of registered token.
    /// @return Token's address.
    function getTokenAddressByName(string _name)
        public constant
        returns (address);

    /// @dev Provides a registered token's metadata, looked up by address.
    /// @param _token Address of registered token.
    /// @return Token metadata.
    function getTokenMetaData(address _token)
        public constant
        returns (
            address,  //tokenAddress
            string,   //name
            string,   //symbol
            uint8,    //decimals
            bytes,    //ipfsHash
            bytes     //swarmHash
        );

    /// @dev Provides a registered token's metadata, looked up by name.
    /// @param _name Name of registered token.
    /// @return Token metadata.
    function getTokenByName(string _name)
        public constant
        returns (
            address,  //tokenAddress
            string,   //name
            string,   //symbol
            uint8,    //decimals
            bytes,    //ipfsHash
            bytes     //swarmHash
        );

    /// @dev Provides a registered token's metadata, looked up by symbol.
    /// @param _symbol Symbol of registered token.
    /// @return Token metadata.
    function getTokenBySymbol(string _symbol)
        public constant
        returns (
            address,  //tokenAddress
            string,   //name
            string,   //symbol
            uint8,    //decimals
            bytes,    //ipfsHash
            bytes     //swarmHash
        );

    /// @dev Returns an array containing all token addresses.
    /// @return Array of token addresses.
    function getTokenAddresses()
        public constant
        returns (address[]);
}
