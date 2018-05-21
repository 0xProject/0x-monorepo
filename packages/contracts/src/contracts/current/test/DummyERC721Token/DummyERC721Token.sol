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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../tokens/ERC721Token/ERC721Token.sol";
import "../../utils/Ownable/Ownable.sol";

contract DummyERC721Token is
    Ownable,
    ERC721Token
{

    /**
    * @dev Constructor passes its arguments to the base ERC721Token constructor
    * @param name of token
    * @param symbol of token
    */
    constructor (
        string name,
        string symbol)
        public
        ERC721Token(name, symbol)
    {}

    /**
    * @dev Function to mint a new token
    * @dev Reverts if the given token ID already exists
    * @param to address the beneficiary that will own the minted token
    * @param tokenId uint256 ID of the token to be minted by the msg.sender
    */
    function mint(address to, uint256 tokenId)
        public
        onlyOwner
    {
        require(
            !exists(tokenId),
            "Token with tokenId already exists."
        );
        _mint(to, tokenId);
    }
}
