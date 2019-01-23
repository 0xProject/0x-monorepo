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

import "../../utils/LibBytes/LibBytes.sol";


// solhint-disable max-line-length
contract TestConstants {
   
    using LibBytes for bytes;

    bytes4 constant internal ERC20_PROXY_ID = bytes4(keccak256("ERC20Token(address)"));
    
    address constant internal KOVAN_ZRX_ADDRESS = 0x6Ff6C0Ff1d68b964901F986d4C9FA3ac68346570;
    bytes constant internal KOVAN_ZRX_ASSET_DATA = "\xf4\x72\x61\xb0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x6f\xf6\xc0\xff\x1d\x68\xb9\x64\x90\x1f\x98\x6d\x4c\x9f\xa3\xac\x68\x34\x65\x70";
    
    address constant internal MAINNET_ZRX_ADDRESS = 0xE41d2489571d322189246DaFA5ebDe1F4699F498;
    bytes constant public MAINNET_ZRX_ASSET_DATA = "\xf4\x72\x61\xb0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xe4\x1d\x24\x89\x57\x1d\x32\x21\x89\x24\x6d\xaf\xa5\xeb\xde\x1f\x46\x99\xf4\x98";
    
    function assertValidZrxAssetData()
        public
        pure
        returns (bool)
    {
        bytes memory kovanZrxAssetData = abi.encodeWithSelector(ERC20_PROXY_ID, KOVAN_ZRX_ADDRESS);
        require(
            kovanZrxAssetData.equals(KOVAN_ZRX_ASSET_DATA),
            "INVALID_KOVAN_ZRX_ASSET_DATA"
        );

        bytes memory mainetZrxAssetData = abi.encodeWithSelector(ERC20_PROXY_ID, MAINNET_ZRX_ADDRESS);
        require(
            mainetZrxAssetData.equals(MAINNET_ZRX_ASSET_DATA),
            "INVALID_MAINNET_ZRX_ASSET_DATA"
        );

        return true;
    }
}
// solhint-enable max-line-length