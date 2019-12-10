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

import "@0x/contracts-erc721/contracts/src/interfaces/IERC721Token.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IERC20Bridge.sol";

contract NullToken {
    function balanceOf(address) external returns (uint256) {
        return 0;
    }
}

contract ERC721CollectorBridge is
    IERC20Bridge,
    DeploymentConstants
{
    address public nullToken;
    uint256 private _fakeERC20Balance;
    mapping (bytes32 => bool) private _filled;

    constructor() public {
        nullToken = address(new NullToken());
    }

    /// @dev Callback for `IERC20Bridge`. Pretends to transfer `toTokenAddress`
    ///      (which should be this contract) and also transfers the NFT id given
    ///      by `nftId`.
    /// @param toTokenAddress `nullToken` when resetting or this contract when
    ///        filling.
    /// @param to The NFT recipient.
    /// @param nftId The NFT ID, as a uint256.
    /// @param bridgeData `abi.encode(nftTokenAddress, nonce)`.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address toTokenAddress,
        address from,
        address to,
        uint256 nftId,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {
        require(msg.sender == _getERC20BridgeProxyAddress(), "ERC721Collector/INVALID_SENDER");
        // Reset fake balance if toTokenAddress is the null token.
        if (toTokenAddress == nullToken) {
            require(nftId == 0, "ERC721Collector/INVALID_RESET_AMOUNT");
            _fakeERC20Balance = 0;
        } else { // Otherwise we're filling an order.
            // Ensure reset was called beforehand.
            require(_fakeERC20Balance == 0, "ERC721Collector/RESET_NEEDED");
            // The bridge data contains the NFT address and a nonce, so hashing it
            // gives us a deterministic order nonce, which will be used to
            // prevent replays.
            bytes32 fillId = keccak256(bridgeData);
            require(!_filled[fillId], "ERC721Collector/ALREADY_FILLED");
            _filled[fillId] = true;
            // Decode the bridge data to get the NFT token.
            address nftTokenAddress = abi.decode(bridgeData, (address));
            // Transfer the NFT.
            IERC721Token(nftTokenAddress).transferFrom(from, to, nftId);
            // Set the fake ERC20 balance so the proxy succeeds.
            _fakeERC20Balance += nftId;
        }
        return BRIDGE_SUCCESS;
    }

    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        return _fakeERC20Balance;
    }
}
