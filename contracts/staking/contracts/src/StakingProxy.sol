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
    MixinConstants,
    Ownable,
    MixinStorage
{
    using LibProxy for address;

    /// @dev Constructor.
    /// @param _stakingContract Staking contract to delegate calls to.
    /// @param _readOnlyProxy The address of the read only proxy.
    constructor(
        address _stakingContract,
        address _readOnlyProxy
    )
        public
        MixinStorage()
    {
        readOnlyProxy = _readOnlyProxy;
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
    /// Note that this is callable only by an authorized address.
    /// @param _stakingContract Address of staking contract.
    function attachStakingContract(address _stakingContract)
        external
        onlyAuthorized
    {
        _attachStakingContract(_stakingContract);
    }

    /// @dev Detach the current staking contract.
    /// Note that this is callable only by an authorized address.
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
                    LibStakingRichErrors.InvalidParamValueErrorCodes.InvalidEpochDuration
            ));
        }

        // Alpha must be 0 < x <= 1
        uint32 _cobbDouglasAlphaDenominator = cobbDouglasAlphaDenominator;
        if (cobbDouglasAlphaNumerator > _cobbDouglasAlphaDenominator || _cobbDouglasAlphaDenominator == 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCodes.InvalidCobbDouglasAlpha
            ));
        }

        // Weight of delegated stake must be <= 100%
        if (rewardDelegatedStakeWeight > PPM_DENOMINATOR) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCodes.InvalidRewardDelegatedStakeWeight
            ));
        }

        // Pools must allow at least one maker
        if (maximumMakersInPool == 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCodes.InvalidMaximumMakersInPool
            ));
        }

        // Minimum stake must be > 1
        if (minimumPoolStake < 2) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValueError(
                    LibStakingRichErrors.InvalidParamValueErrorCodes.InvalidMinimumPoolStake
            ));
        }
    }

    /// @dev Attach a staking contract; future calls will be delegated to the staking contract.
    /// @param _stakingContract Address of staking contract.
    function _attachStakingContract(address _stakingContract)
        internal
    {
        // Attach the staking contract
        stakingContract = readOnlyProxyCallee = _stakingContract;
        emit StakingContractAttachedToProxy(_stakingContract);

        // Call `init()` on the staking contract to initialize storage.
        (bool didInitSucceed, bytes memory initReturnData) = stakingContract.delegatecall(
            abi.encodeWithSelector(IStorageInit(0).init.selector)
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
