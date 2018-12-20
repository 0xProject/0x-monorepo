    
    /*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.4.24;


contract MExchangeCalldata {

    /// @dev Emulates the `calldataload` opcode on the embedded Exchange calldata,
    ///      which is accessed through `signedExchangeTransaction`.
    /// @param offset  Offset into the Exchange calldata.
    /// @return value  Corresponding 32 byte value stored at `offset`.
    function exchangeCalldataload(uint256 offset)
        internal pure
        returns (bytes32 value);

    /// @dev Convenience function that skips the 4 byte selector when loading
    ///      from the embedded Exchange calldata.
    /// @param offset  Offset into the Exchange calldata (minus the 4 byte selector)
    /// @return value  Corresponding 32 byte value stored at `offset` + 4.
    function loadExchangeData(uint256 offset)
        internal pure
        returns (bytes32 value);

    /// @dev Extracts the maker address from an order stored in the Exchange calldata
    ///      (which is embedded in `signedExchangeTransaction`).
    /// @param orderParamIndex  Index of the order in the Exchange function's signature.
    /// @return makerAddress The extracted maker address.
    function loadMakerAddressFromOrder(uint256 orderParamIndex)
        internal pure
        returns (address makerAddress);

    /// @dev Extracts the maker addresses from an array of orders stored in the Exchange calldata
    ///      (which is embedded in `signedExchangeTransaction`).
    /// @param orderArrayParamIndex  Index of the order array in the Exchange function's signature
    /// @return makerAddresses The extracted maker addresses.
    function loadMakerAddressesFromOrderArray(uint256 orderArrayParamIndex)
        internal pure
        returns (address[] makerAddresses);
}
