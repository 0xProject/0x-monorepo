/*
TODO: change token type ID calculation.
    * instead of byte packing and bit shifting, just put full values (not
      truncations) of all class determinants into the struct, and use a
      truncated hash of the struct as the type ID.
    * add order expiration time to the struct!!!
    * consider renaming TokenType struct to FungibilityClass

TODO: implement deposit refund.

TODO: implement deposit forfeiture.

TODO: figure out why inheriting from the canonical IERC1155 interface breaks
things.  try to paste the WHOLE interface into this file.  if that fails,
remove piece by piece to determine which piece is breaking it.

TODO: break up this contract; it's too big.  At least split out the interfaces
(IERC1155 in particular).  Maybe split out the ERC1155 data management from the
"business logic" functions (mint, fill, etc).

TODO: need to implement the erc1155 callback stuff so we can receive erc1155
collateral deposits.

TODO: can we use the 1155 callback mechanism to replace some of the explicit
calls? for example, having a maker-holder transfer their token to this
contract, that could signal a cancel, whereas if a taker-holder transfers it
then it could signal a fill.  BUT, what if a tokenized order uses one of this
contract's tokens for the maker or taker asset; then the maker's good faith
deposit would also trigger the same 1155 callback, so that callback would have
to be smart enough to differentiate these situations.
*/

/*
Feedback from Peter:
    for collateralization,
        either do fully collateralized,
            OR, and interactive process to give the maker time to get the funds
                in place.
        Do fully collateralized as an MVP, and hold off on anything else.
            bigger security and engineering issues pop up with
            undercollateralization.
*/


pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

//import "@0x/contracts-erc1155/contracts/src/interfaces/IERC1155.sol";
import "@0x/contracts-erc1155/contracts/src/interfaces/IERC1155Receiver.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IValidator.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol"; // getOrderHash
import "@0x/contracts-utils/contracts/src/Address.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol"; // safeAdd safeSub


interface IERC1155 {
    /// @notice Transfers value amount of an _id from the _from address to the _to address specified.
    /// @dev MUST emit TransferSingle event on success.
    /// Caller must be approved to manage the _from account's tokens (see isApprovedForAll).
    /// MUST throw if `_to` is the zero address.
    /// MUST throw if balance of sender for token `_id` is lower than the `_value` sent.
    /// MUST throw on any other error.
    /// When transfer is complete, this function MUST check if `_to` is a smart contract (code size > 0).
    /// If so, it MUST call `onERC1155Received` on `_to` and revert if the return value
    /// is not `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`.
    /// @param from    Source address
    /// @param to      Target address
    /// @param id      ID of the token type
    /// @param value   Transfer amount
    /// @param data    Additional data with no specified format, sent in call to `_to`
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external;

    /// @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
    /// @dev MUST emit the ApprovalForAll event on success.
    /// @param operator  Address to add to the set of authorized operators
    /// @param approved  True if the operator is approved, false to revoke approval
    function setApprovalForAll(address operator, bool approved) external;

    /// @notice Queries the approval status of an operator for a given owner.
    /// @param owner     The owner of the Tokens
    /// @param operator  Address of authorized operator
    /// @return           True if the operator is approved, false if not
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    /// @notice Get the balance of multiple account/token pairs
    /// @param owners The addresses of the token holders
    /// @param ids    ID of the Tokens
    /// @return        The _owner's balance of the Token types requested
    function balanceOfBatch(address[] calldata owners, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory balances_);

    function balanceOf(address owner, uint256 tokenId) external view returns(uint256);

    /// @dev Either TransferSingle or TransferBatch MUST emit when tokens are transferred,
    ///      including zero value transfers as well as minting or burning.
    /// Operator will always be msg.sender.
    /// Either event from address `0x0` signifies a minting operation.
    /// An event to address `0x0` signifies a burning or melting operation.
    /// The total value transferred from address 0x0 minus the total value transferred to 0x0 may
    /// be used by clients and exchanges to be added to the "circulating supply" for a given token ID.
    /// To define a token ID with no initial balance, the contract SHOULD emit the TransferSingle event
    /// from `0x0` to `0x0`, with the token creator as `_operator`.
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );

    /// @dev Either TransferSingle or TransferBatch MUST emit when tokens are transferred,
    ///      including zero value transfers as well as minting or burning.
    ///Operator will always be msg.sender.
    /// Either event from address `0x0` signifies a minting operation.
    /// An event to address `0x0` signifies a burning or melting operation.
    /// The total value transferred from address 0x0 minus the total value transferred to 0x0 may
    /// be used by clients and exchanges to be added to the "circulating supply" for a given token ID.
    /// To define multiple token IDs with no initial balance, this SHOULD emit the TransferBatch event
    /// from `0x0` to `0x0`, with the token creator as `_operator`.
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );

    /// @dev MUST emit when an approval is updated.
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    /// @dev MUST emit when the URI is updated for a token ID.
    /// URIs are defined in RFC 3986.
    /// The URI MUST point a JSON file that conforms to the "ERC-1155 Metadata JSON Schema".
    event URI(
        string value,
        uint256 indexed id
    );
}


contract TakerToken is IERC1155, IValidator, LibOrder, SafeMath {
    /*
    @dev The TokenType structure, combined with the order hash, comprises
    the ERC-1155 token identifier.

    As the ERC-1155 standard only grants 256 bits to the token identifier, the
    values comprising the ID must be truncated, since each hash alone is 256
    bits long.  64 bits are granted to the token type portion of the ID
    (composed of 16 bits of each asset data hash, 24 bits for the exchange
    rate, and 8 bits for the collateralization level), and 192 bits are granted
    to the token instance ID (which just a truncated order hash).  Other
    allotments may be more optimal.

    Note that "exchange rate" is an approximation.  This is because it is a
    result of a division operation, and in Solidity division rounds down.
    Consequently, two orders with differing exchange rates can actually be
    considered fungibly equivalent, if the difference in the rate is
    sufficiently miniscule.

    While generally the choice of inversion for a currency exchange rate quote
    (either direct or indirect) is arbitrary, there are reasons that for this
    contract the takerAssetAmount should be in the numerator.  For one thing,
    it permits "free" orders, those with a 0 takerAssetAmount value, which may
    be filled without the holder giving any asset in the exchange.  Calculating
    the exchange rate for such an order would induce a division by zero if
    takerAssetAmount were in the denominator.   Another, more important reason
    is that makerAssetAmount will never be 0, because it would yield a
    worthless token, so it belongs in the denominator.
    */
    struct TokenType {
        uint16 makerAssetDataHash;
        uint16 takerAssetDataHash;
        uint24 exchangeRate;
        uint8 collateralizationLevel;
    }

    mapping(uint64 /*tokenTypeId*/ => TokenType) public tokenTypes; // is this overkill?
    mapping(uint64 /*tokenTypeId*/ => mapping(address /*owner*/ => uint256)) public balances;
    mapping(uint64 /*tokenTypeId*/ => mapping(address /*owner*/ => uint256[] /*tokenIds*/)) public holdings; // is this overkill?

    mapping(uint256 /*tokenId*/ => LibOrder.Order) public orders;
    mapping(uint256 /*tokenId*/ => bytes) public makerSignatures;
    mapping(uint256 /*tokenId*/ => address) public owners;

    mapping(address /*owner*/ => mapping(address /*operator*/ => bool /*approved*/)) internal operatorApproval;

    event Minted(TokenType indexed tokenType, uint256 indexed tokenId, uint64 indexed tokenTypeId);

    event NewTokenType(
        uint16 indexed makerAssetDataHash,
        uint16 indexed takerAssetDataHash,
        uint24 indexed exchangeRate,
        uint8 collateralizationLevel
    );

    IExchange internal exchange;

    // selectors for receiver callbacks
    bytes4 constant public ERC1155_RECEIVED       = 0xf23a6e61;
    bytes4 constant public ERC1155_BATCH_RECEIVED = 0xbc197c81;

    constructor(address _exchange) public
    {
        exchange = IExchange(_exchange);
    }

    function safeTransferFrom( // IERC1155
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    )
        external
    {
        // sanity checks
        require(
            to != address(0x0),
            "CANNOT_TRANSFER_TO_ADDRESS_ZERO"
        );
        require(
            from == msg.sender || operatorApproval[from][msg.sender] == true,
            "INSUFFICIENT_ALLOWANCE"
        );

        uint64 tokenTypeId = getTokenTypeIdFromTokenId(id);

        // perform transfer
        balances[tokenTypeId][from] = safeSub(balances[tokenTypeId][from], value);
        balances[tokenTypeId][to] = safeAdd(balances[tokenTypeId][to], value);

        removeHolding(from, id);
        holdings[tokenTypeId][to].push(id);

        owners[id] = to;

        emit TransferSingle(msg.sender, from, to, id, value);

        // if `to` is a contract then trigger its callback
        if (Address.isContract(to)) {
            bytes4 callbackReturnValue = IERC1155Receiver(to).onERC1155Received(
                msg.sender,
                from,
                id,
                value,
                data
            );
            require(
                callbackReturnValue == ERC1155_RECEIVED,
                "BAD_RECEIVER_RETURN_VALUE"
            );
        }
    }

    function setApprovalForAll(address operator, bool approved) external { // IERC1155
        operatorApproval[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) { // IERC1155
        return operatorApproval[owner][operator];
    }

    function balanceOfBatch(address[] calldata owners, uint256[] calldata ids) // IERC1155
        external
        view
        returns (uint256[] memory balances_)
    {
        // sanity check
        require(
            owners.length == ids.length,
            "OWNERS_AND_IDS_MUST_HAVE_SAME_LENGTH"
        );

        // get balances
        balances_ = new uint256[](owners.length);
        for (uint256 i = 0; i < owners.length; ++i) {
            balances_[i] = balances[getTokenTypeIdFromTokenId(ids[i])][owners[i]];
        }
    }

    /// @dev Returns owner's balance of the TYPE of token that is the given
    ///     token ID.
    function balanceOf(address owner, uint256 tokenId) external view returns(uint256) { // IERC1155
        return balances[getTokenTypeIdFromTokenId(tokenId)][owner];
    }

    function balanceOfType(address owner, uint64 tokenTypeId) external view returns(uint256) {
        return balances[tokenTypeId][owner];
    }

    function mint(
        LibOrder.Order memory orderToTokenize,
        LibOrder.Order memory goodFaithDeposit,
        bytes memory signatureOfOrderToTokenize,
        bytes memory signatureOfDeposit
    )
        public
        returns(uint256 tokenId)
    {
        // TODO: consider eliminating the goodFaithDeposit parameter. we don't
        // really need all that data. we could just have the maker specify a
        // collateralization level, and we can generate the order from that.
        // and we can expose the function that generates that order, so the
        // maker can use it as the basis of its signature.

        // checks

        require(orderToTokenize.makerAddress == msg.sender, "CALLER_MUST_BE_MAKER");
        require(
            orderToTokenize.senderAddress == address(this),
            "SENDER_ADDRESS_MUST_MATCH_TOKEN_ADDRESS"
        );

        require(
            goodFaithDeposit.takerAddress == address(this),
            "DEPOSIT_MISADDRESSED"
        );
        require(
            (
                keccak256(goodFaithDeposit.makerAssetData) ==
                keccak256(orderToTokenize.makerAssetData)
            ),
            "DEPOSIT_ASSET_MISMATCH"
        );

        // TODO: require that goodFaithDeposit.takerAssetData describes a NotCoin.
        // Otherwise, maker could steal tokens from this contract!!!  Would
        // need to pass in a NotCoin deployment address to the constructor, and
        // maybe even also verify a hash of its byte code?
        //     NOTE: this would be solved by providing a canonical
        //     `makeDepositOrder(LibOrder.Order orderToTokenize)` function and
        //     having the maker just pass in a signature of that order rather
        //     than the order itself.

        LibOrder.OrderInfo memory orderInfo = exchange.getOrderInfo(orderToTokenize);
        require(
            exchange.isValidSignature(orderInfo.orderHash, msg.sender, signatureOfOrderToTokenize),
            "INVALID_SIGNATURE"
        );

        TokenType memory tokenType = makeTokenType(orderToTokenize, goodFaithDeposit);

        uint64 tokenTypeId = getTokenTypeIdFromTokenType(tokenType);

        tokenId = getTokenIdFromTypeAndOrder(tokenType, orderToTokenize);

        require(orders[tokenId].makerAddress == address(0), "ORDER_ALREADY_TOKENIZED");
        // TODO: does this check actually work? does a yet-unmapped entry
        // resolve to a legit struct that really does have an accessible
        // makerAddress which happens to be preinitialized to zero?  if so,
        // need to have a better condition here.

        // effects

        if (
            /* sentinel for unmapped value, to potentially save an update: */
            tokenTypes[tokenTypeId].collateralizationLevel == 0
        ) {
            tokenTypes[tokenTypeId] = tokenType;
            emit NewTokenType(
                tokenType.makerAssetDataHash,
                tokenType.takerAssetDataHash,
                tokenType.exchangeRate,
                tokenType.collateralizationLevel
            );
        }

        balances[tokenTypeId][msg.sender] = (
            safeAdd(
                balances[tokenTypeId][msg.sender],
                orderToTokenize.makerAssetAmount
            )
        );

        holdings[tokenTypeId][msg.sender].push(tokenId);

        owners[tokenId] = msg.sender;
        orders[tokenId] = orderToTokenize;
        makerSignatures[tokenId] = signatureOfOrderToTokenize;

        // interactions

        exchange.fillOrder(
            goodFaithDeposit,
            goodFaithDeposit.makerAssetAmount,
            signatureOfDeposit
        );

        // events

        emit Minted(tokenType, tokenId, tokenTypeId);
    }

    function fill(uint256 tokenId, bytes memory orderSignature)
        public
    {
        require(msg.sender == owners[tokenId], "ONLY_TOKEN_OWNER_CAN_FILL");

        LibOrder.OrderInfo memory orderInfo = exchange.getOrderInfo(orders[tokenId]);
        if (
            !exchange.isValidSignature(
                orderInfo.orderHash,
                orders[tokenId].makerAddress,
                makerSignatures[tokenId]
            )
        ) {
            revert("INVALID_SIG");
        }

        LibOrder.Order memory settlementOrder = makeSettlementOrder(tokenId);
        orderInfo = exchange.getOrderInfo(settlementOrder);
        if (
            !exchange.isValidSignature(
                orderInfo.orderHash,
                msg.sender,
                orderSignature
            )
        ) {
            revert("INVALID_SIG2");
        }

        exchange.matchOrders(
            settlementOrder,
            orders[tokenId],
            orderSignature,
            makerSignatures[tokenId]
        );

        // TODO: check if matchOrders failed due to insufficient maker funds,
        // and if so then forfeit the deposit to the token holder.

        // TODO: refund maker their deposit
        //     OR, do we just emit an event here, and put the onus on the maker
        //         to watch for it and submit a deposit request.  Probably
        //         would work best that way, since then we can use a 0x order
        //         (with a NotToken as the other side of the refund) and have
        //         the maker-minter provide a signature along with that order.
        //     OR, do we have the maker submit a pre-signed refund order when
        //         they mint the token so that we already have their signature
        //         on file and can execute the refund right here after all?
        //     OR, do we have the maker submit just a signature for the refund,
        //         upon minting? and we can have a function, eg
        //         `getRefundOrder()`, to provide a basis for that signature,
        //         and to provide a way to construct it at refund time.

        burn(tokenId);
    }

    function getOrder(uint256 tokenId)
        public
        view
        returns(LibOrder.Order memory)
    {
        return orders[tokenId];
    }

    function getHoldings(address owner, uint64 tokenTypeId)
        public
        view
        returns(uint256[] memory)
    {
        return holdings[tokenTypeId][owner];
    }

    function getTokenTypeIdFromTokenId(uint256 tokenId) public pure returns(uint64) {
        return uint64(tokenId / (2 ** 192));
    }

    function getTokenIdFromTypeAndOrder(TokenType memory tokenType, LibOrder.Order memory order)
        public // probably should be internal; public for testing
        view /* because getOrderHash(), and the underlying hashEIP712Message(), are view */
        returns(uint256 tokenId)
    {
        tokenId = (
            uint256(getTokenTypeIdFromTokenType(tokenType)) * 2 ** 192
            + uint192(uint256(getOrderHash(order)))
        );
    }

    function makeTokenId(
        LibOrder.Order memory orderToTokenize,
        LibOrder.Order memory goodFaithDeposit
    )
        public
        view
        returns(uint256)
    {
        return getTokenIdFromTypeAndOrder(makeTokenType(orderToTokenize, goodFaithDeposit), orderToTokenize);
    }

    function makeTokenType(
        LibOrder.Order memory tokenizedOrder,
        LibOrder.Order memory goodFaithDeposit
    )
        public
        pure
        returns(TokenType memory tokenType)
    {
        tokenType.makerAssetDataHash = uint16(bytes2(keccak256(tokenizedOrder.makerAssetData)));
        tokenType.takerAssetDataHash = uint16(bytes2(keccak256(tokenizedOrder.takerAssetData)));

        tokenType.exchangeRate = uint24(
            tokenizedOrder.takerAssetAmount / tokenizedOrder.makerAssetAmount
        );

        tokenType.collateralizationLevel = uint8(
            tokenizedOrder.takerAssetAmount / goodFaithDeposit.makerAssetAmount
        );
    }

    function getTokenTypeIdFromTokenType(TokenType memory tokenType)
        public
        pure
        returns(uint64 tokenTypeId)
    {
        tokenTypeId = (
             uint64(tokenType.makerAssetDataHash) * 2 ** 48 // solhint-disable indent
             + uint64(tokenType.takerAssetDataHash) * 2 ** 32 // solhint-disable indent
             + uint64(tokenType.exchangeRate) * 2 ** 8 // solhint-disable indent
             + tokenType.collateralizationLevel // solhint-disable indent
        );
    }

    function cancel(uint256 tokenId)
        public
    {
        require(
            msg.sender == orders[tokenId].makerAddress,
            "ONLY_MAKER_CAN_CANCEL"
        );

        // TODO: consider removing this exchange call. seems like maker should
        // be able to back out of the token commitment without having to back
        // out of the order itself.
        exchange.cancelOrder(orders[tokenId]);

        // TODO: refund maker their deposit

        burn(tokenId);
    }

    function invertOrder(LibOrder.Order memory order)
        public
        pure
        returns(LibOrder.Order memory inverted)
    {
        inverted.makerAddress = order.takerAddress;

        inverted.feeRecipientAddress = order.feeRecipientAddress;

        inverted.senderAddress = order.senderAddress;

        inverted.makerAssetAmount = order.takerAssetAmount;
        inverted.takerAssetAmount = order.makerAssetAmount;

        inverted.makerFee = order.takerFee;
        inverted.takerFee = order.makerFee;

        inverted.expirationTimeSeconds = order.expirationTimeSeconds;

        inverted.salt = order.salt;

        inverted.makerAssetData = order.takerAssetData;
        inverted.takerAssetData = order.makerAssetData;
    }

    function makeSettlementOrder(uint256 tokenId)
        public
        view
        returns(LibOrder.Order memory settlementOrder)
    {
        settlementOrder = invertOrder(orders[tokenId]);
        settlementOrder.makerAddress = msg.sender;
    }

    function isValidSignature( // IValidator
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        public
        view
        returns (bool isValid)
    {
        require(signerAddress == address(this), "INVALID_SIGNER_ADDRESS");

        uint256 tokenId = LibBytes.readUint256(signature, 0);
        if (hash == getOrderHash(orders[tokenId])) {
            return true;
        }

        if (hash == getOrderHash(makeSettlementOrder(tokenId))) {
            return true;
        }

        return false;
    }

    function burn(uint256 tokenId)
        private
    {
        uint64 tokenTypeId = getTokenTypeIdFromTokenId(tokenId);

        balances[tokenTypeId][msg.sender] = (
            safeSub(
                balances[tokenTypeId][msg.sender],
                orders[tokenId].makerAssetAmount
            )
        );

        removeHolding(msg.sender, tokenId);

        delete orders[tokenId];
        delete makerSignatures[tokenId];
    }

    function removeHolding(address owner, uint256 tokenId) private
    {
        // does a linear search through the appropriate holdings array to find
        // tokenId, then uses swap and pop to remove it.

        uint64 tokenTypeId = getTokenTypeIdFromTokenId(tokenId);
        uint lastHolding = holdings[tokenTypeId][owner].length - 1;
        if (lastHolding > 0) {
            // find index of this token in holdings mapping
            uint256 holdingIndex;
            for (
                holdingIndex = 0;
                holdings[tokenTypeId][owner][holdingIndex] != tokenId;
                holdingIndex++
            ) { /* solhint-disable no-empty-blocks */ }

            // swap elements in holdings array, this token with last token, so we
            // can then pop off this token.
            (
                holdings[tokenTypeId][owner][lastHolding],
                holdings[tokenTypeId][owner][holdingIndex]
            ) = (
                holdings[tokenTypeId][owner][holdingIndex],
                holdings[tokenTypeId][owner][lastHolding]
            );
        }
        require(holdings[tokenTypeId][owner][lastHolding] == tokenId, "HOLDING_NOT_FOUND");

        holdings[tokenTypeId][owner].pop();
    }
}
