pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc1155/contracts/src/interfaces/IERC1155.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


// @dev Tokenized maker & taker positions: derivatives underlied by 0x Orders.
//
// Any maker can submit a signed order to mint a pair of position tokens, one
// whose holder has the exclusive right to be the taker of the order, and one
// whose holder has the obligation to be the maker.
//
// Upon minting, the maker also submits a good faith deposit with the order.
// The expected refund of this deposit, upon fill or expiry of the order, gives
// the maker token its value.  The deposit asset type must match the underlying
// order's maker asset. The deposit amount is chosen by the minter.  The higher
// the deposit, the more valuable the tokens will be.
//
// The combination of the order's asset pair, exchange rate and expiration,
// and also of the amount of the good faith deposit, constitutes a class of
// fungibility.  All tokens having these attributes in common are fungible with
// respect to each other.
//
// More explanation and interpretation is available at
// https://0xproject.quip.com/wWBqAMT6042X/WrappedOrderTokenssol .
//
// This contract is in draft status, pending testing, resolution of all in-code
// "MUSTDO" comments, and the implementation of the following functionality:
//   - Detection of failed fills in the fill() method due to
//       insufficient maker funds, and the consequent filling of the
//       compensationOrder
//   - ERC-1155 approval support
//   - ERC-1155 callbacks, needed to tokenize orders that use 1155 assets
//   - Events
//   - Deposit handling (cf. NotCoin PoC in previous iteration ../TakerToken)
contract WrappedOrderTokens is IERC1155 {
    struct FungibilityClass {
        bytes makerAssetData;
        bytes takerAssetData;
        uint256 takerAssetAmountDividedByMakerAssetAmount;
        uint256 expirationTimeSeconds;
        uint256 makerAssetDepositAmount;
    }

    mapping(
        uint64 /*fungibilitySelector*/ => FungibilityClass
    ) fungibilityClasses;

    mapping(
        uint64 /*fungibilitySelector*/
        => mapping(
            address /*owner*/
            => uint256[] /*tokenIds*/
        )
    ) holdings;

    mapping(uint256 /*tokenId*/ => uint256) takerAssetAmounts;
    mapping(uint256 /*tokenId*/ => uint256) makerAssetAmounts;

    struct MakerInfo {
        address maker;
        bytes tokenizedOrderSignature;
        uint256 tokenizedOrderSalt;
        bytes depositRefundOrderSignature;
        uint256 depositRefundOrderSalt;
    }

    mapping(
        uint64 /*fungibilitySelector*/
        => mapping(
            uint256 /*makerAssetAmount*/
            => MakerInfo[]
        )
    ) makerInfoByAssetAmount;

    uint192 private _nonce;

    IExchange internal exchange;

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
        require(
            takerAssetAmounts[id] == value || makerAssetAmounts[id] == value,
            "TOKEN_HAS_NO_VALUE"
        );

        require(addressHasSpecificHolding(from, id), "UNAUTHORIZED");

        uint64 fungibilitySelector = getFungibilitySelectorFromTokenId(id);

        _deleteFromHoldings(fungibilitySelector, from, id);

        holdings[fungibilitySelector][to].push(id);
    }

    function balanceOf(address owner, uint256 id) // IERC1155
        external view returns (uint256)
    {
        // sum up all of owner's holdings of tokens of the same type as that of
        // the id given.

        uint64 fungibilitySelector = getFungibilitySelectorFromTokenId(id);

        uint256 totalHoldings = 0;

        // MUSTDO: consider whether this accumulation is subject to an overflow
        // error/attack.

        if (takerAssetAmounts[id] > 0) {
            // it's a taker token. sum up owner's taker token holdings.
            for (
                uint i = 0;
                i < holdings[fungibilitySelector][owner].length;
                i++
            ) {
                totalHoldings += takerAssetAmounts[
                    holdings[fungibilitySelector][owner][i]
                ];
            }
        } else if (makerAssetAmounts[id] > 0) {
            // it's a maker token. sum up owner's maker token holdings.
            for (
                uint i = 0;
                i < holdings[fungibilitySelector][owner].length;
                i++
            ) {
                totalHoldings += makerAssetAmounts[
                    holdings[fungibilitySelector][owner][i]
                ];
            }
        } else {
            revert("TOKEN_HAS_NO_VALUE");
        }

        return totalHoldings;
    }

    /**
     * @dev Mint a new maker/taker token pair.  Caller should first use
     * contract methods makeDepositOrder() and makeDepositRefundOrder() in
     * order to prepare the input signatures.
     */
    function mint(
        LibOrder.Order memory orderToTokenize,
        uint256 depositAmount,
        MakerInfo memory makerInfo,
        bytes memory signatureOfDepositOrder,
        uint256 saltForDepositOrder
    )
        public
    {
        // checks

        require(
            orderToTokenize.makerAddress == msg.sender,
            "ORDER_MAKER_MUST_BE_CALLER"
        );
        require(
            orderToTokenize.takerAddress == address(0),
            "ORDER_MUST_NOT_SPECIFY_TAKER"
        );
        require(
            orderToTokenize.senderAddress == address(this),
            "ORDER_SENDER_ADDRESS_MUST_MATCH_TOKEN_ADDRESS"
        );
        require(
            orderToTokenize.makerFee == 0,
            "ORDER_MUST_HAVE_ZERO_MAKER_FEE"
        );
        require(
            orderToTokenize.takerFee == 0,
            "ORDER_MUST_HAVE_ZERO_TAKER_FEE"
        );
        require(
            orderToTokenize.feeRecipientAddress == address(0),
            "ORDER_MUST_NOT_SPECIFY_FEE_RECIPIENT"
        );

        require(
            makerInfo.maker == msg.sender,
            "MAKER_INFO_MUST_MATCH_CALLER"
        );

        // effects

        uint64 fungibilitySelector = makeFungibilitySelector(
            orderToTokenize, depositAmount
        );

        if (
            // sentinel for unmapped value, to potentially save an update:
            fungibilityClasses[fungibilitySelector].makerAssetDepositAmount
            == 0
        ) {
            fungibilityClasses[fungibilitySelector] = FungibilityClass({
                makerAssetData: orderToTokenize.makerAssetData,
                makerAssetDepositAmount: depositAmount,
                takerAssetData: orderToTokenize.takerAssetData,
                takerAssetAmountDividedByMakerAssetAmount: (
                    orderToTokenize.takerAssetAmount /
                    orderToTokenize.makerAssetAmount
                ),
                expirationTimeSeconds: orderToTokenize.expirationTimeSeconds
            });
        }

        uint256 takerTokenId = _makeNewTokenId(fungibilitySelector);

        holdings[fungibilitySelector][msg.sender].push(takerTokenId);

        takerAssetAmounts[takerTokenId] = orderToTokenize.takerAssetAmount;

        uint256 makerTokenId = _makeNewTokenId(fungibilitySelector);

        holdings[fungibilitySelector][msg.sender].push(makerTokenId);

        makerAssetAmounts[makerTokenId] = orderToTokenize.makerAssetAmount;

        makerInfoByAssetAmount[fungibilitySelector][
            orderToTokenize.makerAssetAmount
        ].push(makerInfo);

        // interactions

        exchange.fillOrder(
            makeDepositOrder(
                orderToTokenize, depositAmount, saltForDepositOrder
            ),
            depositAmount,
            signatureOfDepositOrder
        );
    }

    /**
     * @param signatureOfSettlementOrder comes from signing
     *      makeSettlementOrder(
     *          tokenOwnerAddress,
     *          getFungibilitySelectorFromTokenId(tokenId),
     *          takerAssetAmounts[tokenId],
     *          saltForSettlementOrder
     *      ).
     * @param signatureOfCompensationOrder comes from signing
     *      makeCompensationOrder(
     *          tokenizedOrder,
     *          saltForCompensationOrder
     *      ).
     */
    function fill(
        uint256 takerTokenId,
        bytes memory signatureOfSettlementOrder,
        uint256 saltForSettlementOrder,
        bytes memory signatureOfCompensationOrder,
        uint256 saltForCompensationOrder
    )
        public
    {
        // checks

        require(takerAssetAmounts[takerTokenId] > 0, "TOKEN_HAS_NO_VALUE");

        require(
            addressHasSpecificHolding(msg.sender, takerTokenId),
            "SENDER_DOES_NOT_OWN_TOKEN"
        );

        // collations

        uint64 fungibilitySelector = getFungibilitySelectorFromTokenId(
            takerTokenId
        );

        (
            MakerInfo memory makerInfo,
            uint256 makerTokenId
        ) = assignMaker(fungibilitySelector, takerAssetAmounts[takerTokenId]);

        LibOrder.Order memory tokenizedOrder = recreateTokenizedOrder(
            fungibilitySelector,
            takerAssetAmounts[takerTokenId],
            makerInfo
        );

        // because this method uses Exchange.matchOrders() to execute the fill,
        // we construct a "settlement order", in which the taker token holder
        // is the maker:
        LibOrder.Order memory settlementOrder = makeSettlementOrder(
            msg.sender,
            fungibilitySelector,
            takerAssetAmounts[takerTokenId],
            saltForSettlementOrder
        );

        // to be executed if fill is successful:
        LibOrder.Order memory depositRefundOrder = makeDepositRefundOrder(
            tokenizedOrder,
            fungibilityClasses[fungibilitySelector].makerAssetDepositAmount,
            makerInfo.depositRefundOrderSalt
        );

        // to be executed if fill fails due to insufficient maker assets:
        LibOrder.Order memory compensationOrder = makeCompensationOrder(
            tokenizedOrder,
            saltForCompensationOrder
        );

        // effects

        _burnPair(
            takerTokenId,
            msg.sender,
            makerTokenId,
            makerInfo.maker
        );

        // interactions

        exchange.matchOrders(
            settlementOrder,
            tokenizedOrder,
            signatureOfSettlementOrder,
            makerInfo.tokenizedOrderSignature
        );

        // MUSTDO: catch failure in matchOrders. if it failed due to
        // insufficient maker funds for the tokenized order, then fill
        // compensationOrder, else {

        exchange.fillOrder(
            depositRefundOrder,
            depositRefundOrder.takerAssetAmount,
            makerInfo.depositRefundOrderSignature
        );

        // }
    }

    function cancel(uint256 makerTokenId)
        public
    {
        require(makerAssetAmounts[makerTokenId] > 0, "TOKEN_HAS_NO_VALUE");

        uint64 fungibilitySelector = getFungibilitySelectorFromTokenId(
            makerTokenId
        );

        require(
            addressHasSpecificHolding(msg.sender, makerTokenId),
            "SENDER_DOES_NOT_OWN_TOKEN"
        );

        uint256 takerAssetAmount = (
            makerAssetAmounts[makerTokenId] *
            fungibilityClasses[
                fungibilitySelector
            ].takerAssetAmountDividedByMakerAssetAmount
        );

        uint256 takerTokenId = 0;
        // linear search over holdings[fungibilitySelector][msg.sender] to find
        // sender's taker token that corresponds to this maker token.
        for (
            uint i = 0;
            i < holdings[fungibilitySelector][msg.sender].length;
            i++
        ) {
            if (
                takerAssetAmounts[
                    holdings[fungibilitySelector][msg.sender][i]
                ] == takerAssetAmount
            ) {
                takerTokenId = holdings[fungibilitySelector][msg.sender][i];
                break;
            }
        }
        require(takerTokenId != 0, "NO_CORRESPONDING_TAKER_TOKEN");

        _burnPair(takerTokenId, msg.sender, makerTokenId, msg.sender);
    }

    function makeFungibilitySelector(
        LibOrder.Order memory orderToTokenize,
        uint256 depositAmount
    )
        public pure returns (uint64)
    {
        return uint64(
            uint256(keccak256(abi.encode(FungibilityClass({
                makerAssetData: orderToTokenize.makerAssetData,
                takerAssetData: orderToTokenize.takerAssetData,
                takerAssetAmountDividedByMakerAssetAmount: (
                    orderToTokenize.takerAssetAmount /
                    orderToTokenize.makerAssetAmount
                ),
                makerAssetDepositAmount: depositAmount,
                expirationTimeSeconds: orderToTokenize.expirationTimeSeconds
            }))))
            / (2 ** 192)
        );
    }

    function getFungibilitySelectorFromTokenId(uint256 tokenId)
        public pure returns (uint64)
    {
        // return the first 64 bits of the token ID.
        return uint64(tokenId / (2 ** 192));
    }

    function recreateTokenizedOrder(
        uint64 fungibilitySelector,
        uint256 takerAssetAmount,
        MakerInfo memory makerInfo
    )
        public view returns (LibOrder.Order memory)
    {
        FungibilityClass memory fungibilityClass = fungibilityClasses[
            fungibilitySelector
        ];

        return LibOrder.Order({
            makerAddress: makerInfo.maker,
            takerAddress: address(0),
            feeRecipientAddress: address(0),
            senderAddress: address(this),
            makerAssetAmount: (
                takerAssetAmount /
                fungibilityClass.takerAssetAmountDividedByMakerAssetAmount
            ),
            takerAssetAmount: takerAssetAmount,
            makerFee: 0,
            takerFee: 0,
            expirationTimeSeconds: fungibilityClass.expirationTimeSeconds,
            salt: makerInfo.tokenizedOrderSalt,
            makerAssetData: fungibilityClass.makerAssetData,
            takerAssetData: fungibilityClass.takerAssetData
        });
    }

    /**
     * @dev a fill uses 0x Exchange.matchOrders(), using the wrapped order as
     * one side, and a "settlement order" with the taker token holder as the
     * maker as the other side.
     */
    function makeSettlementOrder(
        address takerTokenHolder,
        uint64 fungibilitySelector,
        uint256 takerAssetAmount,
        uint256 salt
    )
        public view returns (LibOrder.Order memory)
    {
        FungibilityClass memory fungibilityClass = (
            fungibilityClasses[fungibilitySelector]
        );
        return LibOrder.Order({
            makerAddress: takerTokenHolder,
            takerAddress: address(this),
            feeRecipientAddress: address(0),
            senderAddress: address(this),
            makerAssetAmount: takerAssetAmount,
            takerAssetAmount: (
                takerAssetAmount /
                fungibilityClass.takerAssetAmountDividedByMakerAssetAmount
            ),
            makerFee: 0,
            takerFee: 0,
            expirationTimeSeconds: fungibilityClass.expirationTimeSeconds,
            salt: salt,
            makerAssetData: fungibilityClass.takerAssetData,
            takerAssetData: fungibilityClass.makerAssetData
        });
    }

    function makeDepositOrder(
        LibOrder.Order memory orderToTokenize,
        uint256 depositAmount,
        uint256 salt
    )
        public pure returns (LibOrder.Order memory)
    {
        // MUSTDO: implement this method.

        /**
         * return an order with its:
         *   - maker and makerAsset matching @param orderToTokenize,
         *   - makerAssetAmount as @param depositAmount,
         *   - taker as this contract,
         *   - salt as @param salt,
         *   - and the takerAsset as a NotCoin.
         */
    }

    function makeDepositRefundOrder(
        LibOrder.Order memory orderToTokenize,
        uint256 depositAmount,
        uint256 salt
    )
        public pure returns (LibOrder.Order memory)
    {
        // MUSTDO: implement this method.

        /**
         * return an order with its:
         *   - maker as this contract
         *   - makerAsset as in orderToTokenize
         *   - makerAssetAmount as @param depositAmount
         *   - taker as in @param orderToTokenize.makerAmount
         *   - salt as @param salt
         *   - takerAsset as a NotCoin.
         */
    }

    /// @dev a "compensation order" is used upon a failure to fill a tokenized
    /// order (due to insufficient maker funds) in order to transfer the
    /// maker's deposit to the taker as compensation for not fulfilling the
    /// agreement.
    function makeCompensationOrder(
        LibOrder.Order memory tokenizedOrder,
        uint256 salt
    )
        public pure returns (LibOrder.Order memory)
    {
        // MUSTDO: implement this method
    }

    function assignMaker(uint64 fungibilitySelector, uint256 takerAssetAmount)
        public view returns (
            MakerInfo memory makerInfo,
            uint256 makerTokenId
        )
    {
        uint256 makerAssetAmount = (
            takerAssetAmount /
            (
                fungibilityClasses[fungibilitySelector]
                    .takerAssetAmountDividedByMakerAssetAmount
            )
        );

        // MUSTDO: determine whether this "random enough":
        uint256 randomMakerIndex = (
            // should we pre-increment the nonce? then there goes `view`...
            (uint256(blockhash(block.number)) + (_nonce))
            % (
                makerInfoByAssetAmount[fungibilitySelector][makerAssetAmount]
                    .length
            )
        );

        makerInfo = makerInfoByAssetAmount[fungibilitySelector][
            makerAssetAmount
        ][randomMakerIndex];

        makerTokenId = 0;
        // do a linear search through maker's holdings to find that
        for (
            uint i = 0;
            i < holdings[fungibilitySelector][makerInfo.maker].length;
            i++
        ) {
            uint256 holding = holdings[fungibilitySelector][
                makerInfo.maker
            ][i];

            if (makerAssetAmounts[holding] == makerAssetAmount) {
                makerTokenId = holding;
            }
        }
        require(makerTokenId != 0, "NO_CORRESPONDING_MAKER_TOKEN");
    }

    function addressHasSpecificHolding(address addr, uint256 tokenId)
        public view returns (bool)
    {
        // linear search through owner's holdings of this fungibility class.
        uint64 fungibilitySelector = getFungibilitySelectorFromTokenId(
            tokenId
        );
        for (uint i = 0; i < holdings[fungibilitySelector][addr].length; i++) {
            if (holdings[fungibilitySelector][addr][i] == tokenId) {
                return true;
            }
        }
        return false;
    }

    function _burnPair(
        uint256 takerTokenId,
        address takerHolder,
        uint256 makerTokenId,
        address makerHolder
    )
        private
    {
        // clean up all state associated with these tokens

        require(
            takerAssetAmounts[takerTokenId] > 0,
            "TAKER_TOKEN_HAS_NO_VALUE"
        );
        require(
            makerAssetAmounts[takerTokenId] == 0,
            "TAKER_TOKEN_HAS_MAKER_VALUE"
        );
        require(
            makerAssetAmounts[makerTokenId] > 0,
            "MAKER_TOKEN_HAS_NO_VALUE"
        );
        require(
            takerAssetAmounts[makerTokenId] == 0,
            "MAKER_TOKEN_HAS_TAKER_VALUE"
        );
        require(
            addressHasSpecificHolding(takerHolder, takerTokenId),
            "TAKER_TOKEN_NOT_HELD_BY_TAKER"
        );
        require(
            addressHasSpecificHolding(makerHolder, makerTokenId),
            "MAKER_TOKEN_NOT_HELD_BY_MAKER"
        );
        uint64 fungibilitySelector = getFungibilitySelectorFromTokenId(
            takerTokenId
        );
        require(
            fungibilitySelector == getFungibilitySelectorFromTokenId(
                makerTokenId
            ),
            "TOKENS_NOT_MUTUALLY_FUNGIBLE"
        );

        // clean up state for maker token

        // linear search through makerInfoByAssetAmount to find one with this
        // maker, then remove it via swap and pop.
        uint256 makerAssetAmount = makerAssetAmounts[makerTokenId];
        uint lastIndex = (
            (
                makerInfoByAssetAmount[fungibilitySelector][makerAssetAmount]
                    .length
            )
            - 1
        );
        for (uint i = 0; i <= lastIndex; i++) {
            if (
                makerInfoByAssetAmount[fungibilitySelector][makerAssetAmount][
                    i
                ].maker == makerHolder
            ) {
                // swap
                (
                    makerInfoByAssetAmount[fungibilitySelector][
                        makerAssetAmount
                    ][i],
                    makerInfoByAssetAmount[fungibilitySelector][
                        makerAssetAmount
                    ][lastIndex]
                ) = (
                    makerInfoByAssetAmount[fungibilitySelector][
                        makerAssetAmount
                    ][lastIndex],
                    makerInfoByAssetAmount[fungibilitySelector][
                        makerAssetAmount
                    ][i]
                );
                // pop
                makerInfoByAssetAmount[fungibilitySelector][makerAssetAmount]
                    .pop();
                break;
            }
        }

        if (
            makerInfoByAssetAmount[fungibilitySelector][makerAssetAmount]
                .length
            == 0
        ) {
            delete fungibilityClasses[fungibilitySelector];
        }

        delete makerAssetAmounts[makerTokenId];

        _deleteFromHoldings(fungibilitySelector, makerHolder, makerTokenId);

        // clean up state for taker token

        delete takerAssetAmounts[takerTokenId];

        _deleteFromHoldings(fungibilitySelector, takerHolder, takerTokenId);
    }

    function _deleteFromHoldings(
        uint64 fungibilitySelector,
        address owner,
        uint256 tokenId
    )
        private
    {
        // linear search over holdings array, then swap and pop

        uint lastHoldingIndex = (
            holdings[fungibilitySelector][owner].length - 1
        );

        for (uint i = 0; i <= lastHoldingIndex; i++) {
            if (holdings[fungibilitySelector][owner][i] == tokenId) {
                // swap
                (
                    holdings[fungibilitySelector][owner][i],
                    holdings[fungibilitySelector][owner][lastHoldingIndex]
                ) = (
                    holdings[fungibilitySelector][owner][lastHoldingIndex],
                    holdings[fungibilitySelector][owner][i]
                );
                // pop
                holdings[fungibilitySelector][owner].pop();
                break;
            }
        }
    }

    function _makeNewTokenId(uint64 fungibilitySelector)
        private returns (uint256)
    {
        // combine the 64-bit fungibility selector input with a unique 192-bit
        // number to form a 256-bit token ID.
        return (
            uint256(fungibilitySelector) * 2 ** 192 + (++_nonce)
        );
    }
}
