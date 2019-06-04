pragma solidity ^0.5.9;

import "./IERC1155.sol";


/// @dev Mintable form of ERC1155
/// Shows how easy it is to mint new items
contract IERC1155Mintable is
    IERC1155
{

    /// @dev creates a new token
    /// @param uri URI of token
    /// @param isNF is non-fungible token
    /// @return _type of token (a unique identifier)
    function create(
        string calldata uri,
        bool isNF
    )
        external
        returns (uint256 type_);

    /// @dev mints fungible tokens
    /// @param id token type
    /// @param to beneficiaries of minted tokens
    /// @param quantities amounts of minted tokens
    function mintFungible(
        uint256 id,
        address[] calldata to,
        uint256[] calldata quantities
    )
        external;

    /// @dev mints a non-fungible token
    /// @param type_ token type
    /// @param to beneficiaries of minted tokens
    function mintNonFungible(
        uint256 type_,
        address[] calldata to
    )
        external;
}
