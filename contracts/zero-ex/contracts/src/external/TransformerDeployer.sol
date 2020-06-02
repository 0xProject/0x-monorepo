/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;


/// @dev A contract with a `die()` function.
interface IKillable {
    function die() external;
}

/// @dev Shared deployer contract for ERC20 transformers implementing some
///      basic membership governance.
///      All members can create or kill transformers individually.
///      A majority vote is required to add or remove memebers.
contract TransformerDeployer {

    /// @dev Emitted when a contract is deployed via `deploy()`.
    event Deployed(address deployedAddress, address member);
    /// @dev Emitted when a contract is killed via `kill()`.
    event Kill(address target, address member);

    /// @dev Represents a member (de)registration vote.
    ///      Should be passed into `addMembers()` and `removeMembers()` with
    ///      accompanying signature.
    struct Vote {
        // Members to add or remove.
        address[] members;
        // How long this vote is valid for.
        uint256 expirationTime;
    }

    /// @dev The EIP712 typehash for `addMembers()` votes.
    bytes32 private immutable ADD_MEMBERS_VOTE_TYPEHASH = keccak256(
        "AddMembersVote(address[] member,uint256 nonce,bytes signature)"
    );
    /// @dev The EIP712 typehash for `removeMembers()` votes.
    bytes32 private immutable REMOVE_MEMBERS_VOTE_TYPEHASH = keccak256(
        "RemoveMembersVote(address[] member,uint256 nonce,bytes signature)"
    );

    /// @dev The EIP712 domain separator.
    bytes32 public immutable EIP712_DOMAIN_SEPARATOR;
    /// @dev The current deployment nonce of this contract.
    ///      Unlike EOAs, contracts start with a nonce of 1.
    uint256 public deploymentNonce = 1;
    /// @dev The number of registered members.
    uint256 public memberCount;
    /// @dev Whether an address is a member.
    mapping(address => bool) public isMember;
    /// @dev Whether a vote was consumed.
    mapping(bytes32 => bool) public isVoteConsumed;

    /// @dev Only a valid member can call the function.
    modifier onlyMember() {
        require(isMember[msg.sender], "TransformerDeployer/ONLY_CALLABLE_By_MEMBER");
        _;
    }

    /// @dev Create this contract and seed the initial members.
    constructor(address[] memory members) public {
        uint256 chainId;
        assembly { chainId := chainid() }
        EIP712_DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256(
                "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
            ),
            keccak256(bytes('TransformerDeployer')),
            keccak256(bytes('1.0.0')),
            chainId,
            address(this)
        ));
        _addMembers(members);
    }

    /// @dev Registers new members. Must attach majority votes.
    function addMembers(Vote[] memory votes, bytes[] memory signatures)
        public
    {
        _consumeVotes(ADD_MEMBERS_VOTE_TYPEHASH, votes, signatures);
        _addMembers(votes[0].members);
    }

    /// @dev Removes existing members. Must attach majority votes.
    function removeMembers(Vote[] memory votes, bytes[] memory signatures)
        public
    {
        _consumeVotes(REMOVE_MEMBERS_VOTE_TYPEHASH, votes, signatures);
        _removeMembers(votes[0].members);
    }

    /// @dev Deploy a new contract. Only callable by a member.
    ///      Any attached ETH will also be forwarded.
    function deploy(bytes memory bytecode)
        public
        payable
        onlyMember
        returns (address deployedAddress)
    {
        deploymentNonce += 1;
        assembly {
            deployedAddress := create(callvalue(), add(bytecode, 32), mload(bytecode))
        }
        emit Deployed(deployedAddress, msg.sender);
    }

    /// @dev Call `die()` on a contract. Only callable by a member.
    function kill(IKillable target)
        public
        onlyMember
    {
        target.die();
    }

    /// @dev Check that votes are valid and have majority and consumes them.
    function _consumeVotes(
        bytes32 typeHash,
        Vote[] memory votes,
        bytes[] memory signatures
    )
        internal
    {
        require(votes.length >= memberCount / 2 + 1, "TransformerDeployer/INSUFFICIENT_VOTES");
        bytes32 membersHash = keccak256(abi.encode(votes[0].members));
        address[] memory signers = new address[](votes.length);
        for (uint256 i = 0; i < votes.length; ++i) {
            // Ensure the vote isn't expired.
            require(votes[i].expirationTime > block.timestamp, "TransformerDeployer/VOTE_EXPIRED");
            // Ensure the members are the same across all votes.
            require(
                membersHash == keccak256(abi.encode(votes[i].members)),
                "TransformerDeployer/NONHOMOGENOUS_VOTE"
            );
            bytes32 voteHash = _getVoteHash(typeHash, votes[i]);
            // Get the signer of the vote.
            address signer = signers[i] = _getVoteSigner(voteHash, signatures[i]);
            // Check for duplicates.
            for (uint256 j = 0; j < i; ++j) {
                require(signers[j] != signer, "TransformerDeployer/DUPLICATE_SIGNER");
            }
            // Ensure signer is a member.
            require(isMember[signer], "TransformerDeployer/NOT_A_MEMBER");
            // Ensure the vote wasn't already consumed.
            require(!isVoteConsumed[voteHash], "TransformerDeployer/ALREADY_VOTED");
            // Mark the vote consumed.
            isVoteConsumed[voteHash] = true;
        }
    }

    /// @dev Get the signer given a vote and signature.
    function _getVoteSigner(
        bytes32 voteHash,
        bytes memory signature
    )
        internal
        pure
        returns (address signer)
    {
        require(signature.length == 65, "TransformerDeployer/INVALID_SIGNATURE");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := and(mload(add(signature, 65)), 0x00000000000000000000000000000000000000000000000000000000000000ff)
        }
        return ecrecover(voteHash, v, r, s);
    }

    /// @dev Get the EIP712 hash of a vote.
    function _getVoteHash(bytes32 typeHash, Vote memory vote)
        internal
        view
        returns (bytes32 voteHash)
    {
        bytes32 messageHash = keccak256(abi.encode(
            typeHash,
            vote.members,
            vote.expirationTime
        ));
        return keccak256(abi.encodePacked(
            '\x19\x01',
            EIP712_DOMAIN_SEPARATOR,
            messageHash
        ));
    }

    /// @dev Register new members.
    function _addMembers(address[] memory members)
        private
    {
        for (uint256 i = 0; i < members.length; ++i) {
            require(!isMember[members[i]], "TransformerDeployer/ALREADY_MEMBER");
            isMember[members[i]] = true;
        }
        memberCount += members.length;
    }

    /// @dev Deregister existing members.
    function _removeMembers(address[] memory members)
        private
    {
        for (uint256 i = 0; i < members.length; ++i) {
            require(isMember[members[i]], "TransformerDeployer/NOT_A_MEMBER");
            isMember[members[i]] = false;
        }
        memberCount -= members.length;
    }
}
