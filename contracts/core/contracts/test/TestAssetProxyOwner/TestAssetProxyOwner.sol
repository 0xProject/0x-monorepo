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

import "../../protocol/AssetProxyOwner/AssetProxyOwner.sol";


// solhint-disable no-empty-blocks
contract TestAssetProxyOwner is
    AssetProxyOwner
{
    constructor (
        address[] memory _owners,
        address[] memory _assetProxyContracts,
        uint256 _required,
        uint256 _secondsTimeLocked
    )
        public
        AssetProxyOwner(_owners, _assetProxyContracts, _required, _secondsTimeLocked)
    {}
    
    function testValidRemoveAuthorizedAddressAtIndexTx(uint256 id)
        public
        view
        validRemoveAuthorizedAddressAtIndexTx(id)
        returns (bool)
    {
        // Do nothing. We expect reverts through the modifier
        return true;
    }
    
    /// @dev Compares first 4 bytes of byte array to `removeAuthorizedAddressAtIndex` function selector.
    /// @param data Transaction data.
    /// @return Successful if data is a call to `removeAuthorizedAddressAtIndex`.
    function isFunctionRemoveAuthorizedAddressAtIndex(bytes memory data)
        public
        pure
        returns (bool)
    {
        return data.readBytes4(0) == REMOVE_AUTHORIZED_ADDRESS_AT_INDEX_SELECTOR;
    }
}
