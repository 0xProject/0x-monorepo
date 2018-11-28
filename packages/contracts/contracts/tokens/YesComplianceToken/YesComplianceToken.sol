pragma solidity ^0.4.24;

import "./IYesComplianceToken.sol";

/**
 * draft implementation of YES compliance token
 *
 * NOTE: i have done relatively few gas optimization tweaks (beyond using the sturctures necessary to avoid any
 * linear time procedures).
 * in some cases i am using a call structure which replicates some checks. this is for code clarity/security -
 * i marked a few obvious ones which could be optimized for gas, but :meh:
 *
 * todo static owner should follow owner token? remove static owner? :security: :should:
 * @author Tyson Malchow
 */
contract YesComplianceToken is YesComplianceTokenV1 {

    uint64 private constant MAX_TOKENS_PER_ENTITY = 10240; // completely arbitrary limit
    uint64 private constant MAX_ENTITIES = 2**32-1; // bc using 32 bit index tracking
    uint64 private constant MAX_VALIDATORS_PER_MARK = 2**32-1; // bc using 32 bit index tracking
    uint64 private constant TOTAL_YES_MARKS = 255; // bc 'uint8 yes'

    // todo could shorten the entity IDs to anything 160+ to make this cheaper?

    /** @notice a single YES attestation */
    struct YesMark {

        /** @notice ISO-3166-1 country codes */
        uint16 countryCode;

        /** @notice the possibly-country-speicifc YES being marked. */
        uint8 yes;

        // 8 bits more space in this slot.. could upgrade yes to uint16?

        /** @notice the index of this mark in EntityRecord.yesMarks */
        uint32 yesMarkIdx;

        /** a list of the validator entities which have attested to this mark */
        uint256[] validatorEntityIds;

        /** @notice index of each validator entity ID in validatorEntityIds */
        mapping(uint256 => uint32) validatorEntityIdIdx;

        // uint8 entityListIdx;
    }

    /**
     * tracks the state for a single recognized entity
     */
    struct EntityRecord {

        /** true marking this entity ID has been encountered */
        bool init;

        /** when true, this entity is effectively useless */
        bool locked;

        // 30 bits more space in this slot

        /** position of the entityId in allEntityIds */
        uint32 entityIdIdx;

        /** used for creating reliable token IDs, monotonically increasing */
        uint64 tokenIdCounter;

        /** indexed YES mark lookups */
        mapping(bytes4 => YesMark) yesMarkByKey;

        /** raw collection of all marks keys */
        bytes4[] yesMarkKeys;

        /**  all tokens associated with this identity */
        uint256[] tokenIds;

        // trellis/tower connection ?
        // civic connection ?
        // erc725/735 connection ?
    }

    /**
     * @notice all fields we want to add per-token.
     *
     * there may never be more than just control flag, in which case it may make sense to collapse this
     * to just a mapping(uint256 => bool) ?
     */
    struct TokenRecord {

        /** position of the tokenId in EntityRecord.tokenIds */
        uint32 tokenIdIdx;

        /** true if this token has administrative superpowers (aka is _not_ limited) */
        bool control;

        /** true if this token cannot move */
        bool finalized;

        // 30 bits more in this slot

        // limitations: in/out?
    }

    address public ownerAddress;

    mapping(uint256 => TokenRecord) public tokenRecordById;
    mapping(uint256 => EntityRecord) public entityRecordById;
    mapping(uint256 => uint256) public entityIdByTokenId;

    /** for entity enumeration. maximum of 2^256-1 total entities (i think we'll be ok) */
    uint256[] entityIds;

    constructor() public {
        /* this space intentionally left blank */
    }

    /**
     * constructor alternative: first-time initialization the contract/token (required because of upgradeability)
     */
    function initialize(string _name, string _symbol) {
        // require(super._symbol.length == 0 || _symbol == super._symbol); // cannot change symbol after first init bc that could fuck shit up
        super.initialize(_name, _symbol); // init token info

        // grant the owner token
        mint_I(ownerAddress, OWNER_ENTITY_ID, true);

        // ecosystem owner gets both owner and validator marks (self-attested)
        setYes_I(OWNER_ENTITY_ID, OWNER_ENTITY_ID, 0, YESMARK_OWNER);
        setYes_I(OWNER_ENTITY_ID, OWNER_ENTITY_ID, 0, YESMARK_VALIDATOR);
    }

    /**
     * executed in lieu of a constructor in a delegated context
     */
    function _upgradeable_initialize() public {

        // some things are still tied to the owner (instead of the yesmark_owner :notsureif:)
        ownerAddress = msg.sender;
    }

    // YesComplianceTokenV1 Interface Methods --------------------------------------------------------------------------

    function isYes(uint256 _validatorEntityId, address _address, uint16 _countryCode, uint8 _yes) external view returns(bool) {
        return isYes_I(_validatorEntityId, _address, _countryCode, _yes);
    }

    function requireYes(uint256 _validatorEntityId, address _address, uint16 _countryCode, uint8 _yes) external view {
        require(isYes_I(_validatorEntityId, _address, _countryCode, _yes));
    }

    function getYes(uint256 _validatorEntityId, address _address, uint16 _countryCode) external view returns(uint8[] memory) {
        if(balanceOf(_address) == 0)
            return new uint8[](0);

        uint256 entityId = entityIdByTokenId[tokenOfOwnerByIndex(_address, 0)];
        EntityRecord storage e = entityRecordById[entityId];
        uint256 j = 0;
        uint256 i;

        // locked always bails
        if(e.locked)
            return new uint8[](0);

        uint8[] memory r = new uint8[](e.yesMarkKeys.length);

        for(i = 0; i < e.yesMarkKeys.length; i++) {
            YesMark storage m = e.yesMarkByKey[e.yesMarkKeys[i]];

            // filter country code
            if(m.countryCode != _countryCode)
                continue;

            // filter explicit validator entity
            if(_validatorEntityId > 0
                    && m.validatorEntityIdIdx[_validatorEntityId] == 0
                    && (m.validatorEntityIds.length == 0 || m.validatorEntityIds[0] == _validatorEntityId))
                continue;

            // matched, chyess
            r[j++] = m.yes;
        }

        // reduce array length
        assembly { mstore(r, j) }

        return r;
    }

    function mint(address _to, uint256 _entityId, bool _control) external returns (uint256) /* internally protected */{
        uint256 callerTokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 callerEntityId = entityIdByTokenId[callerTokenId];

        // make sure caller has a control token, at the least
        require(tokenRecordById[callerTokenId].control, 'control token required');

        // determine/validate the entity being minted for
        uint256 realEntityId;
        if(_entityId == 0 || _entityId == callerEntityId) {
            // unspecified entity, or caller entity, can do!
            realEntityId = callerEntityId;

        } else {
            // otherwise make sure caller is a VALIDATOR, else fail
            require(senderIsControlValidator(), 'illegal entity id'); // some duplicate checks/lookups, gas leak
            realEntityId = _entityId;
        }

        return mint_I(_to, realEntityId, _control);
    }

    function mint(address _to, uint256 _entityId, bool _control, uint16 _countryCode, uint8[] _yes) external returns (uint256) /* internally protected */ {
        // lazy warning: this is a 90% copy/paste job from the mint directly above this

        uint256 callerTokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 callerEntityId = entityIdByTokenId[callerTokenId];

        // make sure caller has a control token, at the least
        require(tokenRecordById[callerTokenId].control, 'control token required');

        // determine/validate the entity being minted for
        uint256 realEntityId;
        if(_entityId == 0 || _entityId == callerEntityId) {
            // unspecified entity, or caller entity, can do!
            realEntityId = callerEntityId;

        } else {
            // otherwise make sure caller is a VALIDATOR, else fail
            require(senderIsControlValidator()); // some duplicate checks/lookups, gas leak
            realEntityId = _entityId;
        }

        // mint the coin
        uint256 tokenId = mint_I(_to, realEntityId, _control);

        // now set the attestations
        require(_yes.length <= TOTAL_YES_MARKS); // safety
        for(uint256 i = 0; i<_yes.length; i++) {
            setYes_I(_entityId, _countryCode, _yes[i]);
        }

        return tokenId;
    }

    function getEntityId(address _address) external view returns (uint256) {
        return entityIdByTokenId[tokenOfOwnerByIndex(_address, 0)];
    }

    function burn(uint256 _tokenId) external permission_control_tokenId(_tokenId) {
        uint256 entityId = entityIdByTokenId[_tokenId];

        EntityRecord storage e = entity(entityId);
        TokenRecord storage t = tokenRecordById[_tokenId];

        // remove token from entity
        e.tokenIds[t.tokenIdIdx] = e.tokenIds[e.tokenIds.length - 1];
        e.tokenIds.length--;

        // update tracked index (of swapped, if present)
        if(e.tokenIds.length > t.tokenIdIdx)
            tokenRecordById[e.tokenIds[t.tokenIdIdx]].tokenIdIdx = t.tokenIdIdx;

        // remove token record
        delete tokenRecordById[_tokenId];

        // burn the actual token
        super._burn(tokenOwner[_tokenId], _tokenId);
    }

    function burnEntity(uint256 _entityId) external permission_control_entityId(_entityId) { // self-burn allowed
        EntityRecord storage e = entity(_entityId);

        // burn all the tokens
        for(uint256 i = 0; i < e.tokenIds.length; i++) {
            uint256 tokenId = e.tokenIds[i];
            super._burn(tokenOwner[tokenId], tokenId);
        }

        // clear all the marks
        clearYes_I(_entityId);

        // clear out entity record
        e.init = false;
        e.locked = false;
        e.entityIdIdx = 0;
        e.tokenIdCounter = 0;

        assert(e.yesMarkKeys.length == 0);
        assert(e.tokenIds.length == 0);
    }

    function setYes(uint256 _entityId, uint16 _countryCode, uint8 _yes) external permission_validator {
        setYes_I(_entityId, _countryCode, _yes);
    }

    function clearYes(uint256 _entityId, uint16 _countryCode, uint8 _yes) external permission_validator {
        require(_yes > 0);
        require(_yes != 128);

        // special check against reserved country code 0
        if(_countryCode == 0)
            require(senderIsEcosystemControl(), 'not authorized as ecosystem control'); // this is duplicating some things, gas leak

        EntityRecord storage e = entity(_entityId);

        uint256 callerTokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 callerEntityId = entityIdByTokenId[callerTokenId];
        bytes4 key = yesKey(_countryCode, _yes);

        YesMark storage mark = e.yesMarkByKey[key];
        if(mark.yes == 0)
            return; // not set by anyone, bail happily

        if(mark.validatorEntityIdIdx[callerEntityId] == 0 &&
                (mark.validatorEntityIds.length == 0 || mark.validatorEntityIds[0] != callerEntityId)) {
            // set, but not by this validator, bail happily
            return;
        }

        clearYes_I(mark, e, callerEntityId);
    }

    function clearYes(uint256 _entityId, uint16 _countryCode) external permission_validator {
        // special check against 129 validator mark
        if(_countryCode == 0)
            require(senderIsEcosystemControl(), 'not authorized as ecosystem control (129)'); // this is duplicating some things, gas leak

        EntityRecord storage e = entity(_entityId);

        uint256 callerTokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 callerEntityId = entityIdByTokenId[callerTokenId];
        uint256 i;

        for(i =0; i<e.yesMarkKeys.length; i++) {
            YesMark storage mark = e.yesMarkByKey[e.yesMarkKeys[i]];

            if(mark.countryCode != _countryCode)
                continue;

            if(mark.validatorEntityIdIdx[callerEntityId] == 0 &&
                    (mark.validatorEntityIds.length == 0 || mark.validatorEntityIds[0] != callerEntityId)) {
                // set, but not by this validator, skip
                continue;
            }

            if(clearYes_I(mark, e, callerEntityId)) {
                // mark was fully destroyed (and replaced in e.yesMarkKeys with the last one)
                i--;
            }
        }
    }

    function clearYes(uint256 _entityId) external permission_validator {
        clearYes_I(_entityId);
    }

    function setLocked(uint256 _entityId, bool _lock) external permission_validator {
        EntityRecord storage e = entity(_entityId);

        // can't fux with owner lock
        require(_entityId != OWNER_ENTITY_ID);

        // if caller isn't ecosystem control, cannot target other validators
        if(!senderIsEcosystemControl())
            require(e.yesMarkByKey[yesKey(0, YESMARK_VALIDATOR)].yes == 0);

        // lockzz
        e.locked = _lock;
    }

    function isLocked(uint256 _entityId) external view returns (bool) {
        return entity(_entityId).locked;
    }

    function isFinalized(uint256 _tokenId) external view returns (bool) {
        return tokenRecordById[_tokenId].finalized;
    }

    function finalize(uint256 _tokenId) external permission_access_tokenId(_tokenId) {
        TokenRecord storage t = tokenRecordById[_tokenId];
        t.finalized = true;
    }

    // Internal Methods ------------------------------------------------------------------------------------------------

    function clearYes_I(YesMark storage mark, EntityRecord storage e, uint256 validatorEntityId) internal returns(bool) {
        uint32 idx = mark.validatorEntityIdIdx[validatorEntityId];
        mark.validatorEntityIds[idx] = mark.validatorEntityIds[mark.validatorEntityIds.length - 1];
        mark.validatorEntityIds.length--;
        delete mark.validatorEntityIdIdx[validatorEntityId];

        // remap
        if(mark.validatorEntityIds.length > idx)
            mark.validatorEntityIdIdx[mark.validatorEntityIds[idx]] = idx;

        // check if the entire mark needs deleting
        if(mark.validatorEntityIds.length == 0) {
            // yes, it does. swap/delete
            idx = mark.yesMarkIdx;
            e.yesMarkKeys[idx] = e.yesMarkKeys[e.yesMarkKeys.length - 1];
            e.yesMarkKeys.length--;

            // remap
            if(e.yesMarkKeys.length > idx)
                e.yesMarkByKey[e.yesMarkKeys[idx]].yesMarkIdx = idx;

            // delete mark
            mark.countryCode = 0;
            mark.yes = 0;
            mark.yesMarkIdx = 0;
            // assert(mark.validatorEntityIds.length == 0);

            return true;
        }

        return false;
    }

    function clearYes_I(uint256 _entityId) internal {
        require(_entityId != OWNER_ENTITY_ID);

        EntityRecord storage e = entity(_entityId);

        // only ecosystem control can touch validators
        if(!senderIsEcosystemControl())
            require(e.yesMarkByKey[yesKey(0, YESMARK_VALIDATOR)].yes == 0);

        uint256 callerTokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 callerEntityId = entityIdByTokenId[callerTokenId];
        uint256 i;

        for(i =0; i<e.yesMarkKeys.length; i++) {
            YesMark storage mark = e.yesMarkByKey[e.yesMarkKeys[i]];

            if(mark.validatorEntityIdIdx[callerEntityId] == 0 &&
                    (mark.validatorEntityIds.length == 0 || mark.validatorEntityIds[0] != callerEntityId)) {
                // set, but not by this validator
                continue;
            }

            if(clearYes_I(mark, e, callerEntityId)) {
                // mark was fully destroyed (and replaced in e.yesMarkKeys with the last one)
                i--;
            }
        }
    }

    function isYes_I(uint256 _validatorEntityId, address _address, uint16 _countryCode, uint8 _yes) internal view returns(bool) {
        if(balanceOf(_address) == 0)
            return false;

        uint256 entityId = entityIdByTokenId[tokenOfOwnerByIndex(_address, 0)];
        EntityRecord storage e = entityRecordById[entityId];

        // locked always bails
        if(e.locked)
            return false;

        // gate out definite nos
        YesMark storage m = e.yesMarkByKey[yesKey(_countryCode, _yes)];
        if(m.yes == 0)
            return false;

        // no specific validators, we good
        if(_validatorEntityId == 0)
            return true;

        // filter by validator
        return m.validatorEntityIdIdx[_validatorEntityId] > 0
            || m.validatorEntityIds.length > 0 && m.validatorEntityIds[0] == _validatorEntityId;
    }

    function setYes_I(uint256 _entityId, uint16 _countryCode, uint8 _yes) internal {
        require(_yes > 0);
        require(_yes != 128);

        // special check against 129 validator mark
        if(_yes == 129)
            require(senderIsEcosystemControl()); // this is duplicating some checks, gas leak

        uint256 callerTokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 callerEntityId = entityIdByTokenId[callerTokenId];

        setYes_I(callerEntityId, _entityId, _countryCode, _yes);
    }

    function setYes_I(uint256 _validatorEntityId, uint256 _entityId, uint16 _countryCode, uint8 _yes) internal {
        // assert(_yes > 0);
        EntityRecord storage targetEntity = entity(_entityId);

        // locate existing mark
        bytes4 key = yesKey(_countryCode, _yes);
        YesMark storage mark = targetEntity.yesMarkByKey[key];

        if(mark.yes == 0) {
            require(targetEntity.yesMarkKeys.length < TOTAL_YES_MARKS);

            // new mark on the entity
            mark.countryCode = _countryCode;
            mark.yes = _yes;
            mark.yesMarkIdx = uint32(targetEntity.yesMarkKeys.length);
            targetEntity.yesMarkKeys.push(key);

        } else if(mark.validatorEntityIdIdx[_validatorEntityId] > 0 ||
                (mark.validatorEntityIds.length > 0 && mark.validatorEntityIds[0] == _validatorEntityId)) {

            // existing mark and the caller is already on it
            /*
            i'm inclined to make it do nothing in this case (instead of failing) since i'm not at this point positive how best
            to distinguish error types to a caller, which would be required for a caller to know wtf to do in this case
            (otherwise they need to query blockchain again)
            (but that costs gas... :notsureif:)
            */
            return;
        }

        require(mark.validatorEntityIds.length < MAX_VALIDATORS_PER_MARK);

        // add this validator to the mark
        mark.validatorEntityIdIdx[_validatorEntityId] = uint32(mark.validatorEntityIds.length);
        mark.validatorEntityIds.push(_validatorEntityId);
    }

    /** non-permissed internal minting impl */
    function mint_I(address _to, uint256 _entityId, bool _control) internal returns (uint256) {
        EntityRecord storage e = entity(_entityId);
        require(e.tokenIds.length < MAX_TOKENS_PER_ENTITY, 'token limit reached');
        require(e.tokenIdCounter < 2**64-1); // kind of ridiculous but whatever, safety first!
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_entityId, e.tokenIdCounter++)));
        super._mint(_to, tokenId);
        tokenRecordById[tokenId].tokenIdIdx = uint32(e.tokenIds.length);
        tokenRecordById[tokenId].control = _control;
        e.tokenIds.push(tokenId);
        entityIdByTokenId[tokenId] = _entityId;
        return tokenId;
    }

    /** entity resolution (creation when needed) */
    function entity(uint256 _entityId) internal returns (EntityRecord storage) {
        require(_entityId > 0);
        EntityRecord storage e = entityRecordById[_entityId];
        if(e.init) return e;
        require(entityIds.length < MAX_ENTITIES);
        e.init = true;
        e.entityIdIdx = uint32(entityIds.length);
        entityIds.push(_entityId);
        return e;
    }

    /** override default addTokenTo for additional transaction limitations */
    function addTokenTo(address _to, uint256 _tokenId) internal {
        uint256 entityId = entityIdByTokenId[_tokenId];

        // ensure one owner cannot be associated with multiple entities
        // NOTE: this breaks hotwallet integrations, at this point necessarily so
        if(balanceOf(_to) > 0) {
            uint256 prevEntityId = entityIdByTokenId[tokenOfOwnerByIndex(_to, 0)];
            require(prevEntityId == entityId, 'conflicting entities');
        }

        require(!tokenRecordById[_tokenId].finalized, 'token is finalized');

        super.addTokenTo(_to, _tokenId);
    }

    /** the sender is the same entity as the one specified */
    function senderIsEntity_ByEntityId(uint256 _entityId) internal view returns (bool) {
        return _entityId == entityIdByTokenId[tokenOfOwnerByIndex(msg.sender, 0)];
    }

    /** the sender is the same entity as the one specified, and the sender is a control for that entity */
    function senderIsControl_ByEntityId(uint256 _entityId) internal view returns (bool) {
        if(balanceOf(msg.sender) == 0)
            return false;
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 senderEntityId = entityIdByTokenId[tokenId];
        return _entityId == senderEntityId && tokenRecordById[tokenId].control;
    }

    /** the sender is a non-locked validator via control token */
    function senderIsControlValidator() internal view returns (bool) {
        if(balanceOf(msg.sender) == 0)
            return false;
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 senderEntityId = entityIdByTokenId[tokenId];
        EntityRecord storage e = entityRecordById[senderEntityId];
        return tokenRecordById[tokenId].control
                && !e.locked
                && entityRecordById[senderEntityId].yesMarkByKey[yesKey(0, YESMARK_VALIDATOR)].yes > 0;
    }

    /** the sender is the same entity as the one tied to the token specified */
    function senderIsEntity_ByTokenId(uint256 _tokenId) internal view returns (bool) {
        if(balanceOf(msg.sender) == 0)
            return false;
        return entityIdByTokenId[_tokenId] == entityIdByTokenId[tokenOfOwnerByIndex(msg.sender, 0)];
    }

    /** the sender is the same entity as the one tied to the token specified, and the sender is a control for that entity */
    function senderIsControl_ByTokenId(uint256 _tokenId) internal view returns (bool) {
        if(balanceOf(msg.sender) == 0)
            return false;
        uint256 senderEntityId = entityIdByTokenId[tokenOfOwnerByIndex(msg.sender, 0)];
        return entityIdByTokenId[_tokenId] == senderEntityId && tokenRecordById[_tokenId].control;
    }

    /** checks if sender is the singular ecosystem owner */
    function senderIsEcosystemControl() internal view returns (bool) {
        // todo deprecate ownerAddress ?!
        return msg.sender == ownerAddress || senderIsControl_ByEntityId(OWNER_ENTITY_ID);
    }

    /** a key for a YES attestation mark */
    function yesKey(uint16 _countryCode, uint8 _yes) internal pure returns(bytes4) {
        return bytes4(keccak256(abi.encodePacked(_countryCode, _yes)));
    }

    // PERMISSIONS MODIFIERS ----------------------------------------------------------------

    modifier permission_validator {
        require(senderIsControlValidator(), 'not authorized as validator');
        _;
    }

    modifier permission_super {
        require(senderIsEcosystemControl(), 'not authorized as ecosystem control');
        _;
    }

//    modifier permission_access_entityId(uint256 _entityId) {
//        require(senderIsEcosystemControl() || senderIsEntity_ByEntityId(_entityId));
//        _;
//    }

    modifier permission_control_entityId(uint256 _entityId) {
        require(senderIsEcosystemControl() || senderIsControl_ByEntityId(_entityId), 'not authorized entity controller');
        _;
    }

    modifier permission_access_tokenId(uint256 _tokenId) {
        require(senderIsEcosystemControl() || senderIsEntity_ByTokenId(_tokenId));
        _;
    }

    modifier permission_control_tokenId(uint256 _tokenId) {
        require(senderIsEcosystemControl() || senderIsControl_ByTokenId(_tokenId), 'not authorized token controller');
        _;
    }

}