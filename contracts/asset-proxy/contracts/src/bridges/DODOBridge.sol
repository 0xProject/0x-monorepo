/*

  Copyright 2020 ZeroEx Intl.

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
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IERC20Bridge.sol";
import "../interfaces/IDODO.sol";


// solhint-disable space-after-comma
// solhint-disable not-rely-on-time
contract DODOBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{


    /// @dev Callback for `IERC20Bridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the `fromTokenAddress`
    ///      token encoded in the bridge data.
    /// @param toTokenAddress The token to buy and transfer to `to`.
    /// @param from The maker (this contract).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoded path of token addresses. Last element must be toTokenAddress
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address toTokenAddress,
        address from,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        address fromTokenAddress = abi.decode(bridgeData, (address));
        IDODO pool = IDODO(IDODOZoo(_getDODOZooAddress()).getDODO(fromTokenAddress, toTokenAddress));
        require(address(pool) != address(0), "DODOBridge/InvalidPool");
        // Get our balance of `fromTokenAddress` token.
        uint256 fromTokenBalance = IERC20Token(fromTokenAddress).balanceOf(address(this));

        // Grant the pool an allowance.
        LibERC20Token.approveIfBelow(
            fromTokenAddress,
            address(pool),
            fromTokenBalance
        );

        uint256 boughtAmount = pool.sellBaseToken(
            fromTokenBalance,
            1,
            new bytes(0)
        );

        // Transfer funds to `to`
        IERC20Token(toTokenAddress).transfer(to, boughtAmount);

        emit ERC20BridgeTransfer(
            // input token
            fromTokenAddress,
            // output token
            toTokenAddress,
            // input token amount
            fromTokenBalance,
            // output token amount
            boughtAmount,
            from,
            to
        );

        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Success bytes, always.
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
}
