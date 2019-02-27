pragma solidity ^0.5.3;

import "./IERC1155.sol";


/// @dev Mintable form of ERC1155
/// Shows how easy it is to mint new items
contract IERC1155Mintable is
    IERC1155
{

    /// @dev creates a new token
    /// @param _uri URI of token
    /// @param _isNF is non-fungible token
    /// @return _type of token (a unique identifier)
    function create(
        string calldata _uri,
        bool _isNF
    )
        external
        returns (uint256 _type);

    /// @dev mints fungible tokens
    /// @param _id token type
    /// @param _to beneficiaries of minted tokens
    /// @param _quantities amounts of minted tokens
    function mintFungible(
        uint256 _id,
        address[] calldata _to,
        uint256[] calldata _quantities
    )
        external;

    /// @dev mints a non-fungible token
    /// @param _type token type
    /// @param _to beneficiaries of minted tokens
    function mintNonFungible(
        uint256 _type,
        address[] calldata _to
    )
        external;
}
