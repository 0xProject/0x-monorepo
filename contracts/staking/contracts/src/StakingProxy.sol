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

import "./libs/LibProxy.sol";
import "./immutable/MixinStorage.sol";
import "./interfaces/IStorageInit.sol";
import "./interfaces/IStakingProxy.sol";


contract StakingProxy is
    IStakingProxy,
    MixinStorage
{
    using LibProxy for address;

    /// @dev Constructor.
    /// @param _stakingContract Staking contract to delegate calls to.
    /// @param _readOnlyProxy The address of the read only proxy.
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    /// @param _ethVaultAddress Address of the EthVault contract.
    /// @param _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    constructor(
        address _stakingContract,
        address _readOnlyProxy,
        address _wethProxyAddress,
        address _ethVaultAddress,
        address _rewardVaultAddress,
        address _zrxVaultAddress
    )
        public
        MixinStorage()
    {
        readOnlyProxy = _readOnlyProxy;
        _attachStakingContract(
            _stakingContract,
            _wethProxyAddress,
            _ethVaultAddress,
            _rewardVaultAddress,
            _zrxVaultAddress
        );
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
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    ///        Use address in storage if NIL_ADDRESS is passed in.
    /// @param _ethVaultAddress Address of the EthVault contract.
    ///        Use address in storage if NIL_ADDRESS is passed in.
    /// @param _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    ///        Use address in storage if NIL_ADDRESS is passed in.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    ///        Use address in storage if NIL_ADDRESS is passed in.
    function attachStakingContract(
        address _stakingContract,
        address _wethProxyAddress,
        address _ethVaultAddress,
        address _rewardVaultAddress,
        address _zrxVaultAddress
    )
        external
        onlyOwner
    {
        _attachStakingContract(
            _stakingContract,
            _wethProxyAddress == NIL_ADDRESS ? address(wethAssetProxy) : _wethProxyAddress,
            _ethVaultAddress == NIL_ADDRESS ? address(ethVault) : _ethVaultAddress,
            _rewardVaultAddress == NIL_ADDRESS ? address(rewardVault) : _rewardVaultAddress,
            _zrxVaultAddress == NIL_ADDRESS ? address(zrxVault) : _zrxVaultAddress
        );
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

    /// @dev Batch executes a series of calls to the staking contract.
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
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    /// @param _ethVaultAddress Address of the EthVault contract.
    /// @param _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    function _attachStakingContract(
        address _stakingContract,
        address _wethProxyAddress,
        address _ethVaultAddress,
        address _rewardVaultAddress,
        address _zrxVaultAddress
    )
        private
    {
        // Attach the staking contract
        stakingContract = readOnlyProxyCallee = _stakingContract;
        emit StakingContractAttachedToProxy(_stakingContract);

        // Call `init()` on the staking contract to initialize storage.
        (bool didInitSucceed, bytes memory initReturnData) = stakingContract.delegatecall(
            abi.encodeWithSelector(
                IStorageInit(0).init.selector,
                _wethProxyAddress,
                _ethVaultAddress,
                _rewardVaultAddress,
                _zrxVaultAddress
            )
        );
        if (!didInitSucceed) {
            assembly {
                revert(add(initReturnData, 0x20), mload(initReturnData))
            }
        }
    }
}
