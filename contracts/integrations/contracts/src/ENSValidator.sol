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

import "@0x/contracts-utils/contracts/src/LibEIP1271.sol";
import "@0x/contracts-utils/contracts/src/LibEIP712.sol";
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IEIP1271Data.sol";
import "./interfaces/IENS.sol";
import "./interfaces/IResolver.sol";


contract ENSValidator is
    LibEIP1271,
    Ownable
{
    using LibBytes for bytes;
    using LibOrder for LibOrder.Order;

    // TODO: Can this be made immutable with Solidity ^0.6.5?
    bytes32 public EIP712_DOMAIN_HASH;

    string constant internal _EIP712_DOMAIN_NAME = "0x Protocol ENS EIP1271 Signature Validator";
    string constant internal _EIP712_DOMAIN_VERSION = "1.0.0";
    address constant internal ENS_ADDRESS = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;

    mapping (bytes32 => address) public resolvedAddressByNode;

    constructor()
        public
        Ownable()
    {
        EIP712_DOMAIN_HASH = LibEIP712.hashEIP712Domain(
            _EIP712_DOMAIN_NAME,
            _EIP712_DOMAIN_VERSION,
            1,  // mainnet
            address(this)
        );
    }

    /// @dev Verifies that a signature is valid.
    /// @param data Arbitrary signed data.
    /// @param signature Proof that data has been signed.
    /// @return magicValue bytes4(0x20c13b0b) if the signature check succeeds.
    function isValidSignature(
        bytes calldata data,
        bytes calldata signature
    )
        external
        view
        returns (bytes4)
    {
        // Ensure that the data passed in by the Exchange contract encodes an order.
        bytes4 dataId = data.readBytes4(0);
        require(
            dataId == IEIP1271Data(address(0)).OrderWithHash.selector,
            "ENSValidator/INVALID_DATA_ENCODING"
        );

        // Decode the order.
        (LibOrder.Order memory order) = abi.decode(
            data.sliceDestructive(4, data.length),
            (LibOrder.Order)
        );

        (bytes32 nodeHash, uint8 v, bytes32 r, bytes32 s) = _decodeSignature(signature);

        require(
            nodeHash != bytes32(0),
            "ENSValidator/NODE_HASH_NOT_STORED"
        );
        address tokenAddress = resolvedAddressByNode[nodeHash];

        // The token address starts after the 16th byte of assetData for ERC20, ERC721, and ERC1155 assetData encodings.
        address takerTokenAddress = order.takerAssetData.readAddress(16);

        // Ensure that node resolved to same token address that is specified in `takerAssetData`.
        require(
            tokenAddress == takerTokenAddress,
            "ENSValidator/TAKER_TOKEN_ADDRESS_MISMATCH"
        );

        // Replace the token address in the `takerAssetData` with the ENS node hash, since that is how the order was originally signed.
        order.takerAssetData.writeBytes32(4, nodeHash);

        // Calculate the hash of the original order.
        // Note that a different hash will be stored in the Exchange contract.
        // However, the hashes will always map 1-1, so no additional replay protection is needed.
        bytes32 orderHash = order.getTypedDataHash(EIP712_DOMAIN_HASH);
        address recoveredAddress = ecrecover(
            orderHash,
            v,
            r,
            s
        );

        // Ensure that the recovered address is the same as the maker
        require(
            order.makerAddress == recoveredAddress,
            "ENSValidator/INVALID_SIGNATURE"
        );

        return EIP1271_MAGIC_VALUE;
    }

    /// @dev Allows the owner to update the address that an ENS node resolves to.
    ///      This can only be called by this contract's owner once per ENS name.
    /// @param nodeHash Node hash of ENS name. See: https://docs.ens.domains/contract-developer-guide/resolving-names-on-chain
    /// @param targetAddress Expected address that nodeHash will resolve to.
    function storeResolvedEnsNode(
        bytes32 nodeHash,
        address targetAddress
    )
        external
        onlyOwner
    {
        // Ensure that an address is not already stored for the given nodeHash.
        // This value can never be changed after being set, even if the ENS name points to a new address.
        address currentStoredAddress = resolvedAddressByNode[nodeHash];
        require(
            currentStoredAddress == address(0),
            "ENSValidator/NODE_HASH_ALREADY_STORED"
        );

        // Resolve the nodeHash to an address.
        IResolver resolver = IENS(ENS_ADDRESS).resolver(nodeHash);
        address resolvedAddress = resolver.addr(nodeHash);

        // Ensure that the resolved address matched the target address.
        // Otherewise, it may have changed due to a race condition.
        require(
            resolvedAddress == targetAddress,
            "ENSValidator/RESOLVED_NODE_MISMATCH"
        );

        // Store the resolved address.
        resolvedAddressByNode[nodeHash] = targetAddress;
    }

    /// @dev Decode a signature intended for this contract into its
    ///      nodeHash, v, r, and s components.
    /// @return nodeHash, v, r, and s.
    function _decodeSignature(bytes memory signature)
        internal
        pure
        returns (
            bytes32 nodeHash,
            uint8 v,
            bytes32 r,
            bytes32 s
        )
    {
        // Signature is encoded as:
        // | Offset | Length | Contents            |
        // | ------ | ------ | ------------------- |
        // | 0      | 32     | nodeHash            |
        // | 32     | 1      | v (always 27 or 28) |
        // | 33     | 32     | r                   |
        // | 65     | 32     | s                   |

        // Find the address that the ENS node resolves to
        nodeHash = signature.readBytes32(0);
        v = uint8(signature[32]);
        r = signature.readBytes32(33);
        s = signature.readBytes32(65);
    }
}
