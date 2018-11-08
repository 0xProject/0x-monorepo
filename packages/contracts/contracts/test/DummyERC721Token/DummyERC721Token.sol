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

pragma solidity 0.4.24;

import "../../tokens/ERC721Token/MintableERC721Token.sol";
import "../../utils/Ownable/Ownable.sol";


// solhint-disable no-empty-blocks
contract DummyERC721Token is
    Ownable,
    MintableERC721Token
{
    string public name;
    string public symbol;

    constructor (
        string _name,
        string _symbol
    )
        public
    {
        name = _name;
        symbol = _symbol;
    }

    /// @dev Function to mint a new token
    ///      Reverts if the given token ID already exists
    /// @param _to Address of the beneficiary that will own the minted token
    /// @param _tokenId ID of the token to be minted by the msg.sender    
    function mint(address _to, uint256 _tokenId)
        external
    {
        _mint(_to, _tokenId);
    }

    /// @dev Function to burn a token
    ///      Reverts if the given token ID doesn't exist or not called by contract owner
    /// @param _owner Owner of token with given token ID
    /// @param _tokenId ID of the token to be burned by the msg.sender
    function burn(address _owner, uint256 _tokenId)
        external
        onlyOwner
    {
        _burn(_owner, _tokenId);
    }
}
