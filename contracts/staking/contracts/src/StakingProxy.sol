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
        onlyAuthorized
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
        onlyAuthorized
    {
        stakingContract = NIL_ADDRESS;
        emit StakingContractDetachedFromProxy();
    }

    /// @dev Set read-only mode (state cannot be changed).
    function setReadOnlyMode(bool readOnlyMode)
        external
        onlyAuthorized
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

    /// @dev Asserts that an epoch is between 5 and 30 days long.
    //       Asserts that 0 < cobb douglas alpha value <= 1.
    //       Asserts that a stake weight is <= 100%.
    //       Asserts that pools allow >= 1 maker.
    //       Asserts that all addresses are initialized.
    function _assertValidStorageParams()
        internal
        view
    {
        // Epoch length must be between 5 and 30 days long
        uint256 _epochDurationInSeconds = epochDurationInSeconds;
        if (_epochDurationInSeconds < 5 days || _epochDurationInSeconds > 30 days) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidEpochDuration
            ));
        }

        // Alpha must be 0 < x <= 1
        uint32 _cobbDouglasAlphaDenominator = cobbDouglasAlphaDenominator;
        if (cobbDouglasAlphaNumerator > _cobbDouglasAlphaDenominator || _cobbDouglasAlphaDenominator == 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidCobbDouglasAlpha
            ));
        }

        // Weight of delegated stake must be <= 100%
        if (rewardDelegatedStakeWeight > PPM_DENOMINATOR) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidRewardDelegatedStakeWeight
            ));
        }

        // Pools must allow at least one maker
        if (maximumMakersInPool == 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidMaximumMakersInPool
            ));
        }

        // ERC20Proxy and Vault contract addresses must always be initialized
        if (address(wethAssetProxy) == NIL_ADDRESS) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidWethProxyAddress
            ));
        }

        if (address(ethVault) == NIL_ADDRESS) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidEthVaultAddress
            ));
        }

        if (address(rewardVault) == NIL_ADDRESS) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidRewardVaultAddress
            ));
        }

        if (address(zrxVault) == NIL_ADDRESS) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidZrxVaultAddress
            ));
        }
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
        internal
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

        // Assert initialized storage values are valid
        _assertValidStorageParams();
    }
}
