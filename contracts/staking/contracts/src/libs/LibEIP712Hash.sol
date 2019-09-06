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

import "@0x/contracts-utils/contracts/src/LibEIP712.sol";
import "../interfaces/IStructs.sol";


library LibEIP712Hash {
    
    // EIP712 Domain Name value for the Staking contract
    string constant internal EIP712_STAKING_DOMAIN_NAME = "0x Protocol Staking";

    // EIP712 Domain Version value for the Staking contract
    string constant internal EIP712_STAKING_DOMAIN_VERSION = "1.0.0";

    // Hash for the EIP712 StakingPool approval message
    // keccak256(abi.encodePacked(
    //  "StakingPoolApproval(",
    //     "bytes32 poolId,",
    //     "address makerAddress",
    //     ")"
    // ));
    bytes32 constant internal EIP712_STAKING_POOL_APPROVAL_SCHEMA_HASH = 0x9b699f12ef1c0f7b43076182dcccc0c548c9a784cfcf27114f98d684e06826b6;

    /// @dev Calculated the EIP712 hash of the StakingPool approval mesasage using the domain separator of this contract.
    /// @param approval StakingPool approval message containing the transaction hash, transaction signature, and expiration of the approval.
    /// @return EIP712 hash of the StakingPool approval message with the domain separator of this contract.
    function _hashStakingPoolApprovalMessage(
        IStructs.StakingPoolApproval memory approval,
        uint256 chainId,
        address verifierAddress
    )
        internal
        pure
        returns (bytes32 approvalHash)
    {
        approvalHash = _hashEIP712StakingMessage(
            _hashStakingPoolApproval(approval),
            chainId,
            verifierAddress
        );
        return approvalHash;
    }

    /// @dev Calculates EIP712 encoding for a hash struct in the EIP712 domain
    ///      of this contract.
    /// @param hashStruct The EIP712 hash struct.
    /// @return EIP712 hash applied to this EIP712 Domain.
    function _hashEIP712StakingMessage(
        bytes32 hashStruct,
        uint256 chainId,
        address verifierAddress
    )
        internal
        pure
        returns (bytes32 result)
    {
        bytes32 eip712StakingDomainHash = LibEIP712.hashEIP712Domain(
            EIP712_STAKING_DOMAIN_NAME,
            EIP712_STAKING_DOMAIN_VERSION,
            chainId,
            verifierAddress
        );
        return LibEIP712.hashEIP712Message(eip712StakingDomainHash, hashStruct);
    }

    /// @dev Calculated the EIP712 hash of the StakingPool approval mesasage with no domain separator.
    /// @param approval StakingPool approval message containing the transaction hash, transaction signature, and expiration of the approval.
    /// @return EIP712 hash of the StakingPool approval message with no domain separator.
    function _hashStakingPoolApproval(IStructs.StakingPoolApproval memory approval)
        internal
        pure
        returns (bytes32 result)
    {
        result = keccak256(abi.encode(
            EIP712_STAKING_POOL_APPROVAL_SCHEMA_HASH,
            approval.poolId,
            approval.makerAddress
        ));
        return result;
    }
}
