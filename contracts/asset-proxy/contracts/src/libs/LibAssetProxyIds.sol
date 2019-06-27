/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.5;


contract LibAssetProxyIds {

    // AssetProxy Ids are equiavalent the first 4 bytes of the keccak256 hash of the function signature assigned to each AssetProxy.

    // ERC20Token(address)
    bytes4 constant public ERC20_PROXY_ID = 0xf47261b0;

    // ERC721Token(address,uint256)
    bytes4 constant public ERC721_PROXY_ID = 0x02571792;

    // ERC1155Assets(address,uint256[],uint256[],bytes)
    bytes4 constant public ERC1155_PROXY_ID = 0xa7cb5fb7;

    // MultiAsset(uint256[],bytes[])
    bytes4 constant public MULTI_ASSET_PROXY_ID = 0x94cfcdd7;

    // StaticCall(address,bytes,bytes32)
    bytes4 constant public STATIC_CALL_PROXY_ID = 0xc339d10a;
}
