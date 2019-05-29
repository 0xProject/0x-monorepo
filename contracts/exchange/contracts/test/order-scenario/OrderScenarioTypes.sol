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
pragma experimental ABIEncoderV2;

import "../../src/MSignatureValidator.sol";


contract OrderScenarioUtil {
    constant uint256 internal ORDER_MAKER_ADDRESS_INDEX_START = 1;
    constant uint256 internal ORDER_MAKER_ADDRESS_INDEX_END = 257;
    constant uint256 internal ORDER_TAKER_ADDRESS_INDEX_START = 258;
    constant uint256 internal ORDER_TAKER_ADDRESS_INDEX_END = 2306;

    enum AssetType {
        // ZRX fee token.
        ERC20_ZRX,
        // An 18 decimal ERC20.
        ERC20_18,
        // A 5 decimal ERC20.
        ERC20_5,
        // An ERC721 NFT.
        ERC721,
        // An ERC1155 fungible token.
        ERC1155_Fungible,
        // And ERC1155 NFT.
        ERC1155_NonFungible,
        // Nested ERC20_18 and ERC20_5.
        MultiAsset_Fungibles,
        // Nested ERC721 and ERC1155_NonFungible.
        MultiAsset_NonFungibles
    }

    // Desired properties for an order to generate.
    // `address` fields can be set to explicit addresses or one of the following
    // special values:
    //      address(0): Empty address
    //      address(1 + M): Adddress of the (0-based) M-th maker in the scenario.
    //      address(258 + (M * 8) + T): Adddress of the (0-based) T-th taker of the M-th order in the scenario.
    struct OrderTraits {
        address takerAddress;
        address feeRecipientAddress;
        address senderAddress;
        AssetType makerAssetType;
        AssetType takerAssetType;
        uint256 makerAssetAmount;
        uint256 takerAssetAmount;
        uint256 makerFee;
        uint256 takerFee;
        uint256 expirationTimeInSeconds;
        uint256 salt;
        MSignatureValidator.SignatureType signatureType;
    }

    struct AssetBalanceAndAllowance {
        uint256 balance;
        uint256 allowance;
    }

    struct TraderBalancesAndAllowances {
        // Asset being offered by the trader.
        AssetBalanceAndAllowance traderAsset;
        // Taker and maker fees the trader is responsible.
        AssetBalanceAndAllowance feeAsset;
    }
}
