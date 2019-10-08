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

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./interfaces/IStructs.sol";
import "./interfaces/IZrxVault.sol";
import "./interfaces/IStakingProxy.sol";


contract ZrxVaultBackstop {

    using LibSafeMath for uint256;

    IStakingProxy public stakingProxy;
    IZrxVault public zrxVault;

    /// @dev Constructor. Sets stakingProxy and zrxVault.
    /// @param _stakingProxyAddress Address of stakingProxy.
    /// @param _zrxVaultAddress Address of zrxVault.
    constructor(
        address _stakingProxyAddress,
        address _zrxVaultAddress
    )
        public
    {
        stakingProxy = IStakingProxy(_stakingProxyAddress);
        zrxVault = IZrxVault(_zrxVaultAddress);
    }

    /// @dev Triggers catastophic failure mode in the zrxzVault iff read-only mode
    ///      has been continuously set for at least 40 days.
    function enterCatastrophicFailureIfProlongedReadOnlyMode()
        external
    {
        IStructs.ReadOnlyState memory readOnlyState = stakingProxy.readOnlyState();

        // Ensure read-only mode is set
        require(
            readOnlyState.isReadOnlyModeSet,
            "READ_ONLY_MODE_NOT_SET"
        );

        // Ensure that the stakingProxy has been in read-only mode for a long enough time
        // TODO: Ensure correct value is set in production
        require(
            // solhint-disable-next-line not-rely-on-time
            block.timestamp.safeSub(readOnlyState.lastSetTimestamp) >= 40 days,
            "READ_ONLY_MODE_DURATION_TOO_SHORT"
        );

        zrxVault.enterCatastrophicFailure();
    }
}
