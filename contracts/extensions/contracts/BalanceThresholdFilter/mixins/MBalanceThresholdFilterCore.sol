/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.4.24;

import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "../interfaces/IThresholdAsset.sol";
import "../interfaces/IBalanceThresholdFilterCore.sol";


contract MBalanceThresholdFilterCore is
    IBalanceThresholdFilterCore
{

    // Points to 0x exchange contract
    // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;

    // The asset that must be held by makers/takers
    IThresholdAsset internal THRESHOLD_ASSET;

    // The minimum balance of `THRESHOLD_ASSET` that must be held by makers/takers
    uint256 internal BALANCE_THRESHOLD;
    // solhint-enable var-name-mixedcase

    // Addresses that hold at least `BALANCE_THRESHOLD` of `THRESHOLD_ASSET`
    event ValidatedAddresses (
        address[] addresses
    );

    /// @dev Constructs an array of addresses to be validated.
    ///      Addresses depend on which Exchange function is to be called
    ///      (defined by `signedExchangeTransaction` above).
    /// @param signerAddress Address of transaction signer.
    /// @return addressesToValidate Array of addresses to validate.
    function getAddressesToValidate(address signerAddress)
        internal pure
        returns (address[] memory addressesToValidate);
}
