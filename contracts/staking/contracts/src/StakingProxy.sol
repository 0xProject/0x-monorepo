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
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "./libs/LibProxy.sol";
import "./immutable/MixinStorage.sol";
import "./interfaces/IStorageInit.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IStakingEvents.sol";
import "./interfaces/IStakingProxy.sol";


contract StakingProxy is
    IStakingEvents,
    IStakingProxy,
    MixinConstants,
    Ownable,
    MixinStorage
{

    using LibProxy for address;

    /// @dev Constructor.
    /// @param _stakingContract Staking contract to delegate calls to.
    /// @param _readOnlyProxy The address of the read only proxy.
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    constructor(address _stakingContract, address _readOnlyProxy, address _wethProxyAddress)
        public
        MixinStorage()
    {
        readOnlyProxy = _readOnlyProxy;
        wethAssetProxy = IAssetProxy(_wethProxyAddress);
        _attachStakingContract(_stakingContract);
    }

    /// @dev Delegates calls to the staking contract, if it is set.
    function ()
        external
        payable
    {
        stakingContract.proxyCall(
            LibProxy.RevertRule.REVERT_ON_ERROR,
            bytes4(0),                              // no custom egress selector
            false                                   // do not ignore ingress selector
        );
    }

    /// @dev Attach a staking contract; future calls will be delegated to the staking contract.
    /// Note that this is callable only by this contract's owner.
    /// @param _stakingContract Address of staking contract.
    function attachStakingContract(address _stakingContract)
        external
        onlyOwner
    {
        _attachStakingContract(_stakingContract);
    }

    /// @dev Detach the current staking contract.
    /// Note that this is callable only by this contract's owner.
    function detachStakingContract()
        external
        onlyOwner
    {
        stakingContract = NIL_ADDRESS;
        emit StakingContractDetachedFromProxy();
    }

    /// @dev Set read-only mode (state cannot be changed).
    function setReadOnlyMode(bool readOnlyMode)
        external
        onlyOwner
    {
        if (readOnlyMode) {
            stakingContract = readOnlyProxy;
        } else {
            stakingContract = readOnlyProxyCallee;
        }

        emit ReadOnlyModeSet(readOnlyMode);
    }

    /// @dev Batch executes a series of calls to the exchange contract.
    /// @param data An array of data that encodes a sequence of functions to
    ///             call in the staking contracts.
    function batchExecute(bytes[] calldata data)
        external
        returns (bytes[] memory batchReturnData)
    {
        // Initialize commonly used variables.
        bool success;
        bytes memory returnData;
        batchReturnData = new bytes[](data.length);
        address staking = stakingContract;
        uint256 dataLength = data.length;

        // Ensure that a staking contract has been attached to the proxy.
        if (staking == address(0)) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.ProxyDestinationCannotBeNilError()
            );
        }

        // Execute all of the calls encoded in the provided calldata.
        for (uint256 i = 0; i != dataLength; i++) {
            // Call the staking contract with the provided calldata.
            (success, returnData) = staking.delegatecall(data[i]);

            // Revert on failure.
            if (!success) {
                assembly {
                    revert(add(0x20, returnData), mload(returnData))
                }
            }

            // Add the returndata to the batch returndata.
            batchReturnData[i] = returnData;
        }

        return batchReturnData;
    }

    /// @dev Attach a staking contract; future calls will be delegated to the staking contract.
    /// @param _stakingContract Address of staking contract.
    function _attachStakingContract(address _stakingContract)
        private
    {
        stakingContract = readOnlyProxyCallee = _stakingContract;
        // Call `init()` on the staking contract to initialize storage.
        (bool didInitSucceed, bytes memory initReturnData) =
            _stakingContract.delegatecall(abi.encode(IStorageInit(0).init.selector));
        if (!didInitSucceed) {
            assembly { revert(add(initReturnData, 0x20), mload(initReturnData)) }
        }
        emit StakingContractAttachedToProxy(_stakingContract);
    }
}
