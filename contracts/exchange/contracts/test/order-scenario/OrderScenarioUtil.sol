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

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-erc20/contracts/test/DummyERC20Token.sol";
import "@0x/contracts-erc1155/contracts/src/ERC1155Mintable.sol";
import "@0x/contracts-erc721/contracts/test/DummyERC721Token.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "@0x/contracts-asset-proxy/contracts/src/libs/LibAssetData.sol";
import "../../src/interfaces/IExchange.sol";
import "./OrderScenarioTypes.sol";
import "./OrderScenarioWallet.sol";


contract OrderScenarioUtil is
    SafeMath
    OrderScenarioTypes
{
    using LibAddressArray for address[];

    IExchange internal _exchange;
    DummyERC20Token internal _erc20EighteenToken;
    DummyERC20Token internal _erc20FiveToken;
    DummyERC20Token internal _zrxToken;
    MintableERC721Token internal _erc721Token;
    ERC1155Mintable internal _erc1155Token;
    mapping(address=>OrderScenarioWallet) internal _wallets;
    uint256 _nonce;

    constructor(address exchangeAddress) public {
        _exchange = IExchange(exchangeAddress);
        // Deploy the tokens.
        _erc20EighteenToken = new DummyERC20Token("ERC20_18", "ERC20_18", 18, 0);
        _erc20FiveToken = new DummyERC20Token("ERC20_5", "ERC20_5", 5, 0);
        _zrxToken = new DummyERC20Token("ERC20_ZRX", "ERC20_ZRX", 18, 0);
        _erc721Token = new MintableERC721Token();
        _erc1155Token = new ERC1155Mintable();
        // Create a fungible ERC1155 token type.
        _erc1155FungibleTokenTypeId = _erc1155Token.create("ERC1155_Fungible", false);
        // Create a non-fungible ERC1155 token type.
        _erc1155NonFungibleTokenTypeId = _erc1155Token.create("ERC1155_NonFungible", true);
    }

    /// @dev Retrieves the addresses of the contracts used by an asset type.
    ///      Every asset aside from MultiAsset types will return a single address
    ///      of the corresponding token contract.
    ///      `MultiAsset_Fungibles` will return ERC20 and ERC1155 contracts.
    ///      `MultiAsset_NonFungibles` will return ERC721 and ERC1155 contracts.
    /// @param assetType The asset type.
    /// @return tokenAddresses Addresses of the token contracts.
    function getAssetToken(AssetType assetType)
        external
        returns (address[] memory tokenAddresses)
    {
        if (assetType == AssetType.ERC20_ZRX) {
            tokenAddresses = [ address(_zrxToken) ];
        } else if (assetType == AssetType.ERC20_18) {
            tokenAddresses = [ address(_erc20EighteenToken) ];
        } else if (assetType == AssetType.ERC20_5) {
            tokenAddresses = [ address(_erc20FiveToken) ];
        } else if (assetType == AssetType.ERC721) {
            tokenAddresses = [ address(_erc721Token) ];
        } else if (assetType == AssetType.ERC1155_Fungible || assetType == AssetType.ERC1155_NonFungible) {
            tokenAddresses = [ address(_erc1155Token) ];
        } else if (assetType == AssetType.MultiAsset_Fungibles) {
            tokenAddresses = [ address(_erc20EighteenToken), address(_erc1155Token) ];
        } else if (assetType == AssetType.MultiAsset_NonFungibles) {
            tokenAddresses = [ address(_erc721Token), address(_erc1155Token) ];
        } else {
            revert("UNKNOWN_ASSET_TYPE");
        }
    }

    /// @dev Call functions on the Exchange from a generated wallet (they will be msg.sender)
    /// @param callData Array of ABI-encoded call data for the functions being called.
    /// @param callerAddresses Array of callers to route each respective call through.
    /// @return callSuccesses Whether each call succeeded (true) or reverted (false).
    /// @return callResults The ABI-encoded result of each call. If the call reverted,
    ///                     this will be an ABI-encoded revert reason.
    function callExchangeFunctionsAs(
        bytes[] memory callData ,
        address[] memory callerAddresses,
    )
        public
        returns (
            bool[] memory callSuccesses,
            bytes[] memory callResults
        )
    {
        address[] memory targets = new address[](callData.length);
        for (uint256 i = 0; i < targets; i++) {
            targets[i] = address(_exchange);
        }
        return callExternalFunctionsAs(
            targets,
            callData,
            callerAddresses
        );
    }

    /// @dev Call functions on target contracts from a generated wallet (they will be msg.sender)
    /// @param targetAddresses Array of target contract addresses.
    /// @param callData Array of ABI-encoded call data for the functions being called.
    /// @param callerAddresses Array of callers to route each respective call through.
    /// @return callSuccesses Whether each call succeeded (true) or reverted (false).
    /// @return callResults The ABI-encoded result of each call. If the call reverted,
    ///                     this will be an ABI-encoded revert reason.
    function callExternalFunctionsAs(
        address[] memory targetAddresses,
        bytes[] memory callData ,
        address[] memory callerAddresses,
    )
        public
        returns (
            bool[] memory callSuccesses,
            bytes[] memory callResults
        )
    {
        uint256 numCalls = callData.length;
        require(
            numCalls == callerAddresses.length &&
            numCalls == targetAddresses.length,
            "LENGTHS_DO_NOT_MATCH"
        );
        callSuccesses = new bool[](numCalls);
        callResults = new bytes[](numCalls);
        for (uint256 i = 0; i != numCalls; i++) {
            address targetAddress = targetAddresses[i];
            bytes memory singleCallData = callData[i];
            address callerAddress = callerAddresses[i];
            address callerWallet = wallets[callerAddress];
            require(
                callerWallet != address(0),
                "CALLER_UNKNOWN"
            );
            (bool didSucceed, bytes memory resultData) = targetAddress.call(
                exchangeAddress,
                singleCallData
            );
            callSuccesses.push(didSucceed);
            callResults.push(resultData);
        }
    }

    /// @@dev Deploys new wallets and immediately funds them.
    /// @param walletCount Number of wallets to deploy.
    /// @param assetTypes Array of arrays of asset types for each wallet.
    /// @param balances  Array of arrays of balance/allowances for each asset type of each wallets.
    /// @return walletAddresses Addresses of each wallet deployed.
    function createAndFundWallets(
        uint256 numWallets,
        AssetType[][] memory assetTypes,
        AssetBalanceAndAllowance[][] memory balances
    )
        public
        returns (address[] memory walletAddresses)
    {
        walletAddresses = createWallets(numWallets);
        fundOwners(
            walletAddresses,
            assetTypes,
            balances
        );
    }

    /// @@dev Deploys new, empty wallets.
    /// @param walletCount Number of wallets to deploy.
    /// @return walletAddresses Addresses of each wallet deployed.
    function createWallets(uint256 numWallets)
        external
        returns (address[] memory walletAddresses)
    {
        walletAddresses = new address[](numWallets);
        for (uint256 i = 0; i != numWallets; i++) {
            OrderScenarioWallet wallet = new OrderScenarioWallet();
            address walletAddress = address(wallet);
            wallets[walletAddress] = wallet;
            walletAddresses.push(walletAddress);
        }
    }

    /// @dev Funds existing addresses with asset types, balances, and allowances.
    ///      This overwrites any balances/allowances that previously existed for
    ///      their respective asset types.
    /// @param ownerAddresses Array of owner addresses.
    /// @param assetTypes Array of arrays of asset types for each owner.
    /// @param balances  Array of arrays of balance/allowances for each asset type of each owner.
    function fundOwners(
        address[] memory ownerAddresses,
        AssetType[][] memory assetTypes,
        AssetBalanceAndAllowance[][] memory balances,
    )
        public
        returns (void)
    {
        uint256 numOwners = ownerAddresses.length;
        require(
            assetTypes.length == numOwners &&
            balances.length == numOwners,
            "LENGTHS_DO_NOT_MATCH"
        );
        for (uint2556 i = 0; i != numOwners; i++) {
            address ownerAddress = ownerAddresses[i];
            AssetType[] memory ownerAssetTypes = assetTypes[i];
            AssetBalanceAndAllowance[] memory ownerBalances = balances[i];
            uint256 numOwnerAssetTypes = ownerAssetTypes.length;
            require(
                numOwnerAssetTypes == ownerBalances.length,
                "LENGTHS_DO_NOT_MATCH"
            );
            for (uint256 j = 0; j != numOwnerAssetTypes; j++) {
                AssetType assetType = ownerAssetTypes[j];
                AssetBalanceAndAllowance memory assetBalance = ownerBalances[j];
                _fundAssetsForOwner(
                    ownerAddress,
                    assetType,
                    assetBalance.balance,
                    assetBalance.allowance,
                    0,
                );
            }
        }
    }

    /// @dev Create multiple orders scenarios.
    ///      This will deploy and fund unique makers and takers, forge
    ///      legitimate orders, and optionally fill or cancel them.
    /// @param orderTraits Desired properties for each order to create.
    /// @param makerBalances Balances/allowances to initialze each order's maker with.
    ///                      One per order.
    /// @param takerBalances Balances/allowances to initialize each order's takers with.
    ///                      Each order can have 0 to 8 takers.
    /// @param cancelOrders Whether to immediately cancel the order. One per order.
    /// @param initialTakerAssetFillAmounts How much to immediately fill the order
    ///                                     One per order.
    /// @return orders The generated orders.
    /// @return orderHashes The hashes of each generated order.
    /// @return takerAddresses The taker wallets deployed for each order.
    function createScenarios(
        OrderTraits[] memory orderTraits,
        TraderBalancesAndAllowances[] memory makerBalances,
        TraderBalancesAndAllowances[][] memory takerBalances,
        bool[] memory cancelOrders,
        uint256[] initialTakerAssetFillAmounts
    )
        public
        returns (
            LibOrder.Order[] memory orders,
            bytes32[] memory orderHashes,
            address[][] memory takerAddresses
        )
    {
        uint256 numScenarios = orderTraits.length;
        require(
            numScenarios == makerBalances.length &&
            numScenarios == takerBalances.length &&
            numScenarios == cancelOrders.length &&
            numScenarios == initialTakerAssetFillAmounts.length
            "LENGTHS_DO_NOT_MATCH",
        );
        for (uint256 i = 0; i != numScenarios; i++) {
            OrderTraits memory singleOrderTraits = orderTraits[i];
            TraderBalancesAndAllowances[] memory singleTakerBalances = takerBalances[i];
            (address makerAddress, address singleTakerAddresses) = _createScenarioWallets(
                singleOrderTraits,
                singleTakerBalances
            );
            LibOrder.Order memory order = _createOrder(orderTraits[i], makerAddress);
            orders.push(order);
            makerAddress.push(makerAddress);
            takerAddresses.push(singleTakerAddresses);
        }
        // TODO
    }

    /// @dev Fund an address with an asset and set asset proxy allowance and return
    ///      the encoded asset data.
    /// @param ownerAddress The owner of the assets.
    /// @param assetType The asset type.
    /// @param balance Amount of `assetType` to mint to owner.
    /// @param allowance Allowance to grant the asset proxy for `assetType`.
    /// @param assetDataAmount Amount of `assetType` to encode in the asset data.
    function _fundAssetsForOwner(
        address ownerAddress,
        AssetType assetType,
        uint256 balance,
        uint256 allowance,
        uint256 assetDataAmount
    )
        internal
        returns (bytes memory assetData)
    {
        if (assetType == AssetType.ERC20_ZRX) {
            assetData = _creatERC20AssetForOwner(
                _zrxToken,
                ownerAddress,
                balance,
                allowance,
                assetData
            );
        } else if (assetType == AssetType.ERC20_18) {
            assetData = _creatERC20AssetForOwner(
                _erc20EighteenToken,
                ownerAddress,
                balance,
                allowance,
                assetData
            );
        } else if (assetType == AssetType.ERC20_5) {
            assetData = _creatERC20AssetForOwner(
                _erc20FiveToken,
                ownerAddress,
                balance,
                allowance,
                assetData
            );
        } else if (assetType == AssetType.ERC721) {
            // If the balance is zero, we mint the NFT to the burn address instead.
            address mintToAddress = balance == 0 ? BURN_ADDRESS : ownerAddress;
            assetData = _creatERC721AssetForOwner(
                mintToAddress,
                allowance,
                assetData
            );
        } else if (assetType == AssetType.ERC1155_Fungible) {
            assetData = _creatERC1155FungibleAssetForOwner(
                ownerAddress,
                balance,
                allowance,
                assetData
            );
        } else if (assetType == AssetType.ERC1155_NonFungible) {
            // If the balance is zero, we mint the NFT to the burn address instead.
            address mintToAddress = balance == 0 ? BURN_ADDRESS : ownerAddress;
            assetData = _creatERC1155FungibleAssetForOwner(
                mintToAddress,
                balance,
                allowance,
                assetData
            );
        } else if (assetType == AssetType.MultiAsset_Fungibles) {
            // Nest an ERC20_18 and ERC1155_Fungible
            assetData = LibAssetData.encodeMultiAssetData(
                _fundAssetsForOwner(
                    ownerAddress,
                    AssetType.ERC20_18,
                    safeMul(balance, MULTI_ASSET_FUNGIBLES_ERC20_UNITS),
                    safeMul(allowance, MULTI_ASSET_FUNGIBLES_ERC20_UNITS),
                    safeMul(assetDataAmount, MULTI_ASSET_FUNGIBLES_ERC20_UNITS)
                ),
                _fundAssetsForOwner(
                    ownerAddress,
                    AssetType.ERC1155_Fungible,
                    safeMul(balance, MULTI_ASSET_FUNGIBLES_ERC1155_UNITS),
                    safeMul(allowance, MULTI_ASSET_FUNGIBLES_ERC1155_UNITS),
                    safeMul(assetDataAmount, MULTI_ASSET_FUNGIBLES_ERC1155_UNITS)
                )
            );
        } else if (assetType == AssetType.MultiAsset_NonFungibles) {
            // Nest an ERC721 and ERC1155_NonFungible
            assetData = LibAssetData.encodeMultiAssetData(
                _fundAssetsForOwner(
                    ownerAddress,
                    AssetType.ERC721,
                    balance,
                    allowance,
                    assetDataAmount
                ),
                _fundAssetsForOwner(
                    ownerAddress,
                    AssetType.ERC1155_NonFungible,
                    balance,
                    allowance,
                    assetDataAmount
                )
            );
        } else {
            revert("UNKNOWN_ASSET_TYPE");
        }
    }

    /// @dev Fund an address with an ERC20 asset, set asset proxy allowance,
    ///      and return the encoded asset data.
    /// @param token Instance of DummyERC20Token.
    /// @param ownerAddress The owner of the ERC20.
    /// @param balance Amount of ERC20 to mint to `ownerAddress`.
    /// @param allowance ERC20 allowance to grant the asset proxy.
    /// @param assetDataAmount Amount of tokens to encode in the asset data.
    function _creatERC20AssetForOwner(
        DummyERC20Token token,
        address ownerAddress,
        uint256 balance,
        uint256 allowance,
        uint256 assetDataAmount
    )
        internal
        returns (bytes memory assetData)
    {
        address assetProxyAddress = _exchange.getAssetProxy(ERC20_ASSET_PROXY_ID);
        address tokenAddress = address(token);
        token.setBalance(ownerAddress, balance);
        token.approve(assetProxyAddress, allowance);
        assetData = LibAssetData.encodeERC20AssetData(tokenAddress);
        emit FundERC20(
            tokenAddress,
            ownerAddress,
            balance,
            allowance,
            assetData
        );
    }

    /// @dev Fund an address with an ERC721 NFT, set asset proxy allowance,
    ///      and return the encoded asset data.
    /// @param ownerAddress The owner of the ERC721 NFT.
    /// @param allowance ERC721 allowance to grant the asset proxy.
    /// @param assetDataAmount Amount of tokens to encode in the asset data.
    function _creatERC721AssetForOwner(
        address ownerAddress,
        uint256 allowance,
        uint256 assetDataAmount
    )
        internal
        returns (bytes memory assetData)
    {
        address assetProxyAddress = _exchange.getAssetProxy(ERC721_ASSET_PROXY_ID);
        address tokenAddress = address(_erc721Token);
        bytes32 tokenId = uint256(_generateNextHash());
        _erc721Token.mint(ownerAddress, tokenId);
        // Set the proxy allowance.
        if (allowance == 1) {
            // Approve for just this NFT.
            _erc721Token.approve(assetProxyAddress, tokenId);
        } else if (allowance > 1) {
            // Approve for all NFTs.
            _erc721Token.setApprovalForAll(assetProxyAddress, true);
        } // else allowance == 0, no approval granted (the default)
        assetData = LibAssetData.encodeERC721AssetData(
            tokenAddress,
            tokenId
        );
        emit FundERC721(
            tokenAddress,
            ownerAddress,
            tokenId,
            allowance,
            assetData
        );
    }

    /// @dev Fund an address with fungible ERC1155 tokens, set asset proxy allowance,
    ///      and return the encoded asset data.
    /// @param ownerAddress The owner of the tokens.
    /// @param balance Amount of tokens to mint to `ownerAddress`.
    /// @param allowance token allowance to grant the asset proxy.
    /// @param assetDataAmount Amount of tokens to encode in the asset data.
    function _creatERC1155FungibleAssetForOwner(
        address ownerAddress,
        uint256 balance,
        uint256 allowance,
        uint256 assetDataAmount
    )
        internal
        returns (bytes memory assetData)
    {
        address assetProxyAddress = _exchange.getAssetProxy(ERC1155_ASSET_PROXY_ID);
        address tokenAddress = address(_erc1155Token);
        if (balance != 0) {
            _erc1155Token.mintFungible(
                _erc1155FungibleTokenTypeId,
                _toSingularArray(ownerAddress),
                _toSingularArray(balance)
            );
        }
        if (allowance != 0) {
            _erc1155Token.setApprovalForAll(assetProxyAddress, true);
        }
        assetData = LibAssetData.encodeERC1155AssetData(
            tokenAddress,
            _toSingularArray(_erc1155FungibleTokenTypeId),
            _toSingularArray(assetDataAmount),
            new bytes[](0)
        );
        emit FundERC1155Fungible(
            tokenAddress,
            ownerAddress,
            balance,
            allowance,
            assetData
        );
    }

    /// @dev Fund an address with an ERC1155 NFT, set asset proxy allowance,
    ///      and return the encoded asset data.
    /// @param ownerAddress The owner of the ERC1155 NFT.
    /// @param allowance ERC1155 allowance to grant the asset proxy.
    /// @param assetDataAmount Amount of tokens to encode in the asset data.
    function _creatERC1155AssetForOwner(
        address ownerAddress,
        uint256 allowance,
        uint256 assetDataAmount
    )
        internal
        returns (bytes memory assetData)
    {
        address assetProxyAddress = _exchange.getAssetProxy(ERC1155_ASSET_PROXY_ID);
        uint256 tokenId;
        tokenId = _erc1155Token.mintNonFungible(
            _erc1155NonFungibleTokenTypeId,
            _toSingularArray(ownerAddress)
        );
        // Set the proxy allowance.
        if (allowance != 0) {
            _erc1155Token.setApprovalForAll(assetProxyAddress, true);
        }
        assetData = LibAssetData.encodeERC1155AssetData(
            address(_erc1155Token),
            _toSingularArray(tokenId),
            _toSingularArray(assetDataAmount),
            new bytes[](0)
        );
        emit FundERC1155NonFungible(
            tokenAddress,
            ownerAddress,
            tokenId,
            allowance,
            assetData
        );
    }

    function _generateNextHash() internal returns (bytes32 hash) {
        hash = keccak256(abi.encode(address(this), _nonce));
        _nonce += 1;
    }

    function _toSingularArray(address value)
        internal
        pure
        returns (address[] memory array)
    {
        array = new address[](1);
        array[0] = value;
    }

    function _toSingularArray(uint256 value)
        internal
        pure
        returns (uint256[] memory array)
    {
        array = new uint256[](1);
        array[0] = value;
    }
}
