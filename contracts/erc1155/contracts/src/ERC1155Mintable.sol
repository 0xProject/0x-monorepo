pragma solidity ^0.5.3;

import "./lib/SafeMath.sol";
import "./ERC1155.sol";
import "./interfaces/IERC1155Mintable.sol";


/// @dev Mintable form of ERC1155
/// Shows how easy it is to mint new items
contract ERC1155Mintable is
    IERC1155Mintable,
    ERC1155
{

    /// token nonce
    uint256 internal nonce;

    /// mapping from token to creator
    mapping (uint256 => address) public creators;

    /// mapping from token to max index
    mapping (uint256 => uint256) public maxIndex;

    /// asserts token is owned by msg.sender
    modifier creatorOnly(uint256 _id) {
        require(creators[_id] == msg.sender);
        _;
    }

    /// @dev creates a new token
    /// @param _uri URI of token
    /// @param _isNF is non-fungible token
    /// @return _type of token (a unique identifier)
    function create(
        string calldata _uri,
        bool _isNF
    )
        external
        returns (uint256 _type)
    { 
        // Store the type in the upper 128 bits
        _type = (++nonce << 128);

        // Set a flag if this is an NFI.
        if (_isNF) {
            _type = _type | TYPE_NF_BIT;
        }

        // This will allow restricted access to creators.
        creators[_type] = msg.sender;

        // emit a Transfer event with Create semantic to help with discovery.
        emit TransferSingle(msg.sender, address(0x0), address(0x0), _type, 0);

        if (bytes(_uri).length > 0)
            emit URI(_uri, _type);
    }

    /// @dev mints fungible tokens
    /// @param _id token type
    /// @param _to beneficiaries of minted tokens
    /// @param _quantities amounts of minted tokens
    function mintFungible(
        uint256 _id,
        address[] calldata _to,
        uint256[] calldata _quantities
    )
        external
        creatorOnly(_id)
    {

        require(isFungible(_id));

        for (uint256 i = 0; i < _to.length; ++i) {

            address to = _to[i];
            uint256 quantity = _quantities[i];

            // Grant the items to the caller
            balances[_id][to] = safeAdd(quantity, balances[_id][to]);

            // Emit the Transfer/Mint event.
            // the 0x0 source address implies a mint
            // It will also provide the circulating supply info.
            emit TransferSingle(msg.sender, address(0x0), to, _id, quantity);

            if (to.isContract()) {
                require(IERC1155Receiver(to).onERC1155Received(msg.sender, msg.sender, _id, quantity, "") == ERC1155_RECEIVED);
            }
        }
    }

    /// @dev mints a non-fungible token
    /// @param _type token type
    /// @param _to beneficiaries of minted tokens
    function mintNonFungible(
        uint256 _type,
        address[] calldata _to
    )
        external
        creatorOnly(_type)
    {
        // No need to check this is a nf type rather than an id since
        // creatorOnly() will only let a type pass through.
        require(isNonFungible(_type));

        // Index are 1-based.
        uint256 index = maxIndex[_type] + 1;

        for (uint256 i = 0; i < _to.length; ++i) {
            address dst = _to[i];
            uint256 id  = _type | index + i;

            nfOwners[id] = dst;

            // You could use base-type id to store NF type balances if you wish.
            // balances[_type][dst] = quantity.safeAdd(balances[_type][dst]);

            emit TransferSingle(msg.sender, address(0x0), dst, id, 1);

            if (dst.isContract()) {
                require(IERC1155Receiver(dst).onERC1155Received(msg.sender, msg.sender, id, 1, "") == ERC1155_RECEIVED);
            }
        }

        maxIndex[_type] = safeAdd(_to.length, maxIndex[_type]);
    }
}
