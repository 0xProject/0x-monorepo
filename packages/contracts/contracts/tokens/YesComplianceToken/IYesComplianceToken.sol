pragma solidity ^0.4.24;

import "./WyreERC721Token/ERC721Token.sol";

/**
 * @notice an ERC721 "yes" compliance token supporting a collection of country-specific attributions which answer specific
 * compliance-related queries with YES. (attestations)
 *
 * primarily ERC721 is useful for the self-management of claiming addresses. a single token is more useful
 * than a non-ERC721 interface because of interop with other 721-supporting systems/ui; it allows users to
 * manage their financial stamp with flexibility using a well-established simple concept of non-fungible tokens.
 * this interface is for anyone needing to carry around and otherwise manage their proof of compliance.
 *
 * the financial systems these users authenticate against have a different set of API requirements. they need
 * more contextualization ability than a balance check to support distinctions of attestations, as well as geographic
 * distinction. these integrations are made simpler as the language of the query more closely match the language of compliance.
 *
 * this interface describes, beyond 721, these simple compliance-specific interfaces (and their management tools)
 *
 * notes:
 *  - no address can be associated with more than one identity (though addresses may have more than token). issuance
 *    in this circumstance will fail
 *  - one person or business = one entity
 *  - one entity may have many tokens across many addresses; they can mint and burn tokens tied to their identity at will
 *  - two token types: control & non-control. both carry compliance proof
 *  - control tokens let their holders mint and burn (within the same entity)
 *  - non-control tokens are solely for compliance queries
 *  - a lock on the entity is used instead of token revocation to remove the cash burden assumed by a customer to
 *    redistribute a fleet of coins
 *  - all country codes should be via ISO-3166-1
 *
 * any (non-view) methods not explicitly marked idempotent are not idempotent.
 */
contract YesComplianceTokenV1 is ERC721Token /*, ERC165 :should: */ {

    uint256 public constant OWNER_ENTITY_ID = 1;

    uint8 public constant YESMARK_OWNER = 128;
    uint8 public constant YESMARK_VALIDATOR = 129;

    /*
     todo events: entity updated, destroyed, ????
     Finalized
     Attested

     */

    /**
     * @notice query api: returns true if the specified address has the given country/yes attestation. this
     * is the primary method partners will use to query the active qualifications of any particular
     * address.
     */
    function isYes(uint256 _validatorEntityId, address _address, uint16 _countryCode, uint8 _yes) external view returns(bool) ;

    /** @notice same as isYes except as an imperative */
    function requireYes(uint256 _validatorEntityId, address _address, uint16 _countryCode, uint8 _yes) external view ;

    /**
     * @notice retrieve all YES marks for an address in a particular country
     * @param _validatorEntityId the validator ID to consider. or, use 0 for any of them
     * @param _address the validator ID to consider, or 0 for any of them
     * @param _countryCode the ISO-3166-1 country code
     * @return (non-duplicate) array of YES marks present
     */
    function getYes(uint256 _validatorEntityId, address _address, uint16 _countryCode) external view returns(uint8[] /* memory */);

    // function getCountries(uint256 _validatorEntityId, address _address) external view returns(uint16[]  /* memory */);

    /**
     * @notice create new tokens. fail if _to already
     * belongs to a different entity and caller is not validator
     * @param _control true if the new token is a control token (can mint, burn). aka NOT limited.
     * @param _entityId the entity to mint for, supply 0 to use the entity tied to the caller
     * @return the newly created token ID
     */
    function mint(address _to, uint256 _entityId, bool _control) external returns (uint256);

    /** @notice shortcut to mint() + setYes() in one call, for a single country */
    function mint(address _to, uint256 _entityId, bool _control, uint16 _countryCode, uint8[] _yes) external returns (uint256);

    /** @notice destroys a specific token */
    function burn(uint256 _tokenId) external;

    /** @notice destroys the entire entity and all tokens */
    function burnEntity(uint256 _entityId) external;

    /**
     * @notice adds a specific attestations (yes) to an entity. idempotent: will return normally even if the mark
     * was already set by this validator
     */
    function setYes(uint256 _entityId, uint16 _countryCode, uint8 _yes) external;

    /**
     * @notice removes a attestation(s) from a specific validator for an entity. idempotent
     */
    function clearYes(uint256 _entityId, uint16 _countryCode, uint8 _yes) external;

    /** @notice removes all attestations in a given country for a particular entity. idempotent */
    function clearYes(uint256 _entityId, uint16 _countryCode) external;

    /** @notice removes all attestations for a particular entity. idempotent */
    function clearYes(uint256 _entityId) external;

    /** @notice assigns a lock to an entity, rendering all isYes queries false. idempotent */
    function setLocked(uint256 _entityId, bool _lock) external;

    /** @notice checks whether or not a particular entity is locked */
    function isLocked(uint256 _entityId) external view returns(bool);

    /** @notice returns true if the specified token has been finalized (cannot be moved) */
    function isFinalized(uint256 _tokenId) external view returns(bool);

    /** @notice finalizes a token by ID preventing it from getting moved. idempotent */
    function finalize(uint256 _tokenId) external;

    /** @return the entity ID associated with an address (or fail if there is not one) */
    function getEntityId(address _address) external view returns(uint256);

}