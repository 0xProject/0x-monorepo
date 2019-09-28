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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IWallet.sol";
import "./ERC20Bridge.sol";
import "../interfaces/IEth2Dai.sol";


// solhint-disable space-after-comma
contract Eth2DaiBridge is
    ERC20Bridge,
    IWallet
{
    bytes4 private constant LEGACY_WALLET_MAGIC_VALUE = 0xb0671381;
    /* Mainnet addresses */
    address constant public ETH2DAI_ADDRESS = 0x39755357759cE0d7f32dC8dC45414CCa409AE24e;
    address constant public WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant public DAI_ADDRESS = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359;

    constructor() public {
        // Grant the Eth2Dai contract unlimited weth and dai allowances.
        _getWethContract().approve(address(_getEth2DaiContract()), uint256(-1));
        _getDaiContract().approve(address(_getEth2DaiContract()), uint256(-1));
    }

    /// @dev Callback for `IERC20Bridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the opposing asset
    ///      (DAI or WETH) to the Eth2Dai contract, then transfers the bought
    ///      tokens to `to`.
    /// @param toTokenAddress The token to give to `to` (either DAI or WETH).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @return success The magic bytes `0xb5d40d78` if successful.
    function transfer(
        bytes calldata /* bridgeData */,
        address toTokenAddress,
        address /* from */,
        address to,
        uint256 amount
    )
        external
        returns (bytes4 success)
    {
        // The "from" token is the opposite of the "to" token.
        IERC20Token fromToken = _getWethContract();
        IERC20Token toToken = _getDaiContract();
        // Swap them if necessary.
        if (toTokenAddress == address(fromToken)) {
            (fromToken, toToken) = (toToken, fromToken);
        } else {
            require(
                toTokenAddress == address(toToken),
                "INVALID_ETH2DAI_TOKEN"
            );
        }
        // Try to sell all of this contract's `fromToken` balance.
        uint256 boughtAmount = _getEth2DaiContract().sellAllAmount(
            address(fromToken),
            fromToken.balanceOf(address(this)),
            address(toToken),
            amount
        );
        // Transfer the converted `toToken`s to `to`.
        toToken.transfer(to, boughtAmount);
        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    function isValidSignature(
        bytes32,
        bytes calldata
    )
        external
        view
        returns (bytes4 magicValue)
    {
        return LEGACY_WALLET_MAGIC_VALUE;
    }

    /// @dev Overridable way to get the weth contract.
    function _getWethContract()
        internal
        view
        returns (IERC20Token)
    {
        return IERC20Token(WETH_ADDRESS);
    }

    /// @dev Overridable way to get the dai contract.
    function _getDaiContract()
        internal
        view
        returns (IERC20Token)
    {
        return IERC20Token(DAI_ADDRESS);
    }

    /// @dev Overridable way to get the eth2dai contract.
    function _getEth2DaiContract()
        internal
        view
        returns (IEth2Dai)
    {
        return IEth2Dai(ETH2DAI_ADDRESS);
    }
}
