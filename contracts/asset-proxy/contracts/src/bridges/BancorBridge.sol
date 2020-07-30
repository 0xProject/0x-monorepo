
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
import "../interfaces/IBancorNetwork.sol";


contract BancorBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{

    IContractRegistry contractRegistry = IContractRegistry(0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4);
    bytes32 bancorNetworkName = bytes32(uint(0x42616e636f724e6574776f726b)); // "BancorNetwork"

    struct TransferState {
        uint minReturn;
        address[] addressPath;
        IERC20Token[] tokenPath;
    }

    /// @dev Callback for `IERC20Bridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the `fromTokenAddress`
    ///      token encoded in the bridge data, then transfers the bought
    ///      tokens to `to`.
    /// @param toTokenAddress The token to buy and transfer to `to`.
    /// @param from The maker (this contract).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoded conversion path addresses
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
        // hold variables to get around stack depth limitations
        TransferState memory state;

        // Decode the bridge data.
        (
            state.addressPath,
            state.minReturn
        // solhint-disable indent
        ) = abi.decode(bridgeData, (address[], uint));
        // solhint-enable indent

        require(state.addressPath.length >= 2, "BancorBridge/PATH_LENGTH_MUST_BE_AT_LEAST_TWO");
        require(state.addressPath[state.addressPath.length - 1] == toTokenAddress, "BancorBridge/LAST_ELEMENT_OF_PATH_MUST_MATCH_OUTPUT_TOKEN");

        // Just transfer the tokens if they're the same.
        if (state.addressPath[0] == toTokenAddress) {
            LibERC20Token.transfer(state.addressPath[0], to, amount);
            return BRIDGE_SUCCESS;
        }

        // Otherwise use Bancor to convert
        // Convert the addresses in the path to IERC20Tokens
        for (uint i=0; i < state.addressPath.length; i++) {
            state.tokenPath[i] = IERC20Token(state.addressPath[i]);
        }

        // // Grant an allowance to the Bancor Network to spend `fromTokenAddress` token.
        uint256 fromTokenBalance = state.tokenPath[0].balanceOf(address(this));
        LibERC20Token.approveIfBelow(state.addressPath[0], contractRegistry.addressOf(bancorNetworkName), fromTokenBalance);

        // Convert the tokens
        IBancorNetwork bancorNetwork = getBancorNetworkContract();
        uint256 boughtAmount = bancorNetwork.convertByPath(
            state.tokenPath, // path originating with source token and terminating in destination token
            fromTokenBalance, // amount of source token to trade
            amount, // minimum amount of destination token expected to receive
            to, // beneficiary
            address(0x0), // affiliateAccount; no fee paid
            0 // affiliateFee; no fee paid
        );

        emit ERC20BridgeTransfer(
            state.addressPath[0], // fromTokenAddress
            toTokenAddress,
            fromTokenBalance,
            boughtAmount,
            from,
            to
        );
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
    
    function getBancorNetworkContract() public returns(IBancorNetwork){
        return IBancorNetwork(contractRegistry.addressOf(bancorNetworkName));
    }
}
