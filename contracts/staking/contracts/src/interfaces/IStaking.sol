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

import "./IStructs.sol";


interface IStaking {

    /// @dev Moves stake between statuses: 'active', 'inactive' or 'delegated'.
    ///      This change comes into effect next epoch.
    /// @param from status to move stake out of.
    /// @param to status to move stake into.
    /// @param amount of stake to move.
    function moveStake(
        IStructs.StakeInfo calldata from,
        IStructs.StakeInfo calldata to,
        uint256 amount
    )
        external;

    /// @dev Pays a protocol fee in ETH.
    /// @param makerAddress The address of the order's maker.
    /// @param payerAddress The address that is responsible for paying the protocol fee.
    /// @param protocolFeePaid The amount of protocol fees that should be paid.
    function payProtocolFee(
        address makerAddress,
        address payerAddress,
        uint256 protocolFeePaid
    )
        external
        payable;

    /// @dev Stake ZRX tokens. Tokens are deposited into the ZRX Vault. Unstake to retrieve the ZRX.
    ///      Stake is in the 'Active' status.
    /// @param amount of ZRX to stake.
    function stake(uint256 amount)
        external;
}
