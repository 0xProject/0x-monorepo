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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetProxy.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "../interfaces/IEthVault.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../interfaces/IZrxVault.sol";
import "../libs/LibStakingRichErrors.sol";


contract MixinParams is
    IStakingEvents,
    MixinStorage
{
    /// @dev Set all configurable parameters at once.
    /// @param _epochDurationInSeconds Minimum seconds between epochs.
    /// @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param _maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
    /// @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    /// @param _ethVaultAddress Address of the EthVault contract.
    /// @param _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    function setParams(
        uint256 _epochDurationInSeconds,
        uint32 _rewardDelegatedStakeWeight,
        uint256 _minimumPoolStake,
        uint256 _maximumMakersInPool,
        uint32 _cobbDouglasAlphaNumerator,
        uint32 _cobbDouglasAlphaDenominator,
        address _wethProxyAddress,
        address _ethVaultAddress,
        address payable _rewardVaultAddress,
        address _zrxVaultAddress
    )
        external
        onlyOwner
    {
        _setParams(
            _epochDurationInSeconds,
            _rewardDelegatedStakeWeight,
            _minimumPoolStake,
            _maximumMakersInPool,
            _cobbDouglasAlphaNumerator,
            _cobbDouglasAlphaDenominator,
            _wethProxyAddress,
            _ethVaultAddress,
            _rewardVaultAddress,
            _zrxVaultAddress
        );
    }

    /// @dev Retrieves all configurable parameter values.
    /// @return _epochDurationInSeconds Minimum seconds between epochs.
    /// @return _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @return _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @return _maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
    /// @return _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @return _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    /// @return _wethProxyAddress The address that can transfer WETH for fees.
    /// @return _ethVaultAddress Address of the EthVault contract.
    /// @return _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @return _zrxVaultAddress Address of the ZrxVault contract.
    function getParams()
        external
        view
        returns (
            uint256 _epochDurationInSeconds,
            uint32 _rewardDelegatedStakeWeight,
            uint256 _minimumPoolStake,
            uint256 _maximumMakersInPool,
            uint32 _cobbDouglasAlphaNumerator,
            uint32 _cobbDouglasAlphaDenominator,
            address _wethProxyAddress,
            address _ethVaultAddress,
            address _rewardVaultAddress,
            address _zrxVaultAddress
        )
    {
        _epochDurationInSeconds = epochDurationInSeconds;
        _rewardDelegatedStakeWeight = rewardDelegatedStakeWeight;
        _minimumPoolStake = minimumPoolStake;
        _maximumMakersInPool = maximumMakersInPool;
        _cobbDouglasAlphaNumerator = cobbDouglasAlphaNumerator;
        _cobbDouglasAlphaDenominator = cobbDouglasAlphaDenominator;
        _wethProxyAddress = address(wethAssetProxy);
        _ethVaultAddress = address(ethVault);
        _rewardVaultAddress = address(rewardVault);
        _zrxVaultAddress = address(zrxVault);
    }

    /// @dev Initialize storage belonging to this mixin.
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    /// @param _ethVaultAddress Address of the EthVault contract.
    /// @param _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    function _initMixinParams(
        address _wethProxyAddress,
        address _ethVaultAddress,
        address payable _rewardVaultAddress,
        address _zrxVaultAddress
    )
        internal
    {
        // Ensure state is uninitialized.
        _assertParamsNotInitialized();

        // Set up defaults.
        // These cannot be set to variables, or we go over the stack variable limit.
        _setParams(
            10 days,                       // epochDurationInSeconds
            (90 * PPM_DENOMINATOR) / 100,  // rewardDelegatedStakeWeight
            100 * MIN_TOKEN_VALUE,         // minimumPoolStake
            10,                            // maximumMakersInPool
            1,                             // cobbDouglasAlphaNumerator
            2,                             // cobbDouglasAlphaDenominator
            _wethProxyAddress,
            _ethVaultAddress,
            _rewardVaultAddress,
            _zrxVaultAddress
        );
    }

    /// @dev Asserts that upgradable storage has not yet been initialized.
    function _assertParamsNotInitialized()
        internal
        view
    {
        if (epochDurationInSeconds != 0 &&
            rewardDelegatedStakeWeight != 0 &&
            minimumPoolStake != 0 &&
            maximumMakersInPool != 0 &&
            cobbDouglasAlphaNumerator != 0 &&
            cobbDouglasAlphaDenominator != 0 &&
            address(wethAssetProxy) != NIL_ADDRESS &&
            address(ethVault) != NIL_ADDRESS &&
            address(rewardVault) != NIL_ADDRESS &&
            address(zrxVault) != NIL_ADDRESS
        ) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InitializationError(
                    LibStakingRichErrors.InitializationErrorCode.MixinParamsAlreadyInitialized
                )
            );
        }
    }

    /// @dev Set all configurable parameters at once.
    /// @param _epochDurationInSeconds Minimum seconds between epochs.
    /// @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param _maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
    /// @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    /// @param _ethVaultAddress Address of the EthVault contract.
    /// @param _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    function _setParams(
        uint256 _epochDurationInSeconds,
        uint32 _rewardDelegatedStakeWeight,
        uint256 _minimumPoolStake,
        uint256 _maximumMakersInPool,
        uint32 _cobbDouglasAlphaNumerator,
        uint32 _cobbDouglasAlphaDenominator,
        address _wethProxyAddress,
        address _ethVaultAddress,
        address payable _rewardVaultAddress,
        address _zrxVaultAddress
    )
        private
    {
        epochDurationInSeconds = _epochDurationInSeconds;
        rewardDelegatedStakeWeight = _rewardDelegatedStakeWeight;
        minimumPoolStake = _minimumPoolStake;
        maximumMakersInPool = _maximumMakersInPool;
        cobbDouglasAlphaNumerator = _cobbDouglasAlphaNumerator;
        cobbDouglasAlphaDenominator = _cobbDouglasAlphaDenominator;
        wethAssetProxy = IAssetProxy(_wethProxyAddress);
        ethVault = IEthVault(_ethVaultAddress);
        rewardVault = IStakingPoolRewardVault(_rewardVaultAddress);
        zrxVault = IZrxVault(_zrxVaultAddress);

        emit ParamsSet(
            _epochDurationInSeconds,
            _rewardDelegatedStakeWeight,
            _minimumPoolStake,
            _maximumMakersInPool,
            _cobbDouglasAlphaNumerator,
            _cobbDouglasAlphaDenominator,
            _wethProxyAddress,
            _ethVaultAddress,
            _rewardVaultAddress,
            _zrxVaultAddress
        );
    }
}
