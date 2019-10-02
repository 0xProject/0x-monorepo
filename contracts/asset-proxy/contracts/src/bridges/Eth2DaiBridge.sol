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
import "../interfaces/IERC20Bridge.sol";
import "../interfaces/IEth2Dai.sol";
import "../interfaces/IWallet.sol";


// solhint-disable space-after-comma
contract Eth2DaiBridge is
    IERC20Bridge,
    IWallet
{
    /* Mainnet addresses */
    address constant public ETH2DAI_ADDRESS = 0x39755357759cE0d7f32dC8dC45414CCa409AE24e;

    /// @dev Callback for `IERC20Bridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the opposing asset
    ///      (DAI or WETH) to the Eth2Dai contract, then transfers the bought
    ///      tokens to `to`.
    /// @param toTokenAddress The token to give to `to` (either DAI or WETH).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoeded "from" token address.
    /// @return success The magic bytes if successful.
    function withdrawTo(
        address toTokenAddress,
        address /* from */,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));

        IEth2Dai exchange = _getEth2DaiContract();
        // Grant an allowance to the exchange to spend `fromTokenAddress` token.
        IERC20Token(fromTokenAddress).approve(address(exchange), uint256(-1));

        // Try to sell all of this contract's `fromTokenAddress` token balance.
        uint256 boughtAmount = _getEth2DaiContract().sellAllAmount(
            address(fromTokenAddress),
            IERC20Token(fromTokenAddress).balanceOf(address(this)),
            toTokenAddress,
            amount
        );
        // Transfer the converted `toToken`s to `to`.
        _transferERC20Token(toTokenAddress, to, boughtAmount);
        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Magic success bytes, always.
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

    /// @dev Overridable way to get the eth2dai contract.
    /// @return exchange The Eth2Dai exchange contract.
    function _getEth2DaiContract()
        internal
        view
        returns (IEth2Dai exchange)
    {
        return IEth2Dai(ETH2DAI_ADDRESS);
    }

    /// @dev Permissively transfers an ERC20 token that may not adhere to
    ///      specs.
    /// @param tokenAddress The token contract address.
    /// @param to The token recipient.
    /// @param amount The amount of tokens to transfer.
    function _transferERC20Token(
        address tokenAddress,
        address to,
        uint256 amount
    )
        private
    {
        // Transfer tokens.
        // We do a raw call so we can check the success separate
        // from the return data.
        (bool didSucceed, bytes memory returnData) = tokenAddress.call(
            abi.encodeWithSelector(
                IERC20Token(0).transfer.selector,
                to,
                amount
            )
        );
        if (!didSucceed) {
            assembly { revert(add(returnData, 0x20), mload(returnData)) }
        }

        // Check return data.
        // If there is no return data, we assume the token incorrectly
        // does not return a bool. In this case we expect it to revert
        // on failure, which was handled above.
        // If the token does return data, we require that it is a single
        // value that evaluates to true.
        assembly {
            if returndatasize {
                didSucceed := 0
                if eq(returndatasize, 32) {
                    // First 64 bytes of memory are reserved scratch space
                    returndatacopy(0, 0, 32)
                    didSucceed := mload(0)
                }
            }
        }
        require(didSucceed, "ERC20_TRANSFER_FAILED");
    }
}
