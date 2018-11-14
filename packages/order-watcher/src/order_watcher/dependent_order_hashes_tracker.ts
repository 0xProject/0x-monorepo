// tslint:disable:no-unnecessary-type-assertion
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, ERC20AssetData, ERC721AssetData, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

export interface OrderHashesByMakerAddress {
    [makerAddress: string]: Set<string>;
}

export interface OrderHashesByERC20ByMakerAddress {
    [makerAddress: string]: {
        [erc20TokenAddress: string]: Set<string>;
    };
}

export interface OrderHashesByERC721AddressByTokenIdByMakerAddress {
    [makerAddress: string]: {
        [erc721TokenAddress: string]: {
            // Ideally erc721TokenId should be a BigNumber, but it's not a valid index type so we just convert it to a string before using it as an index
            [erc721TokenId: string]: Set<string>;
        };
    };
}

/**
 */
export class DependentOrderHashesTracker {
    private readonly _zrxTokenAddress: string;
    // `_orderHashesByMakerAddress` is redundant and could be generated from
    // `_orderHashesByERC20ByMakerAddress` and `_orderHashesByERC721AddressByTokenIdByMakerAddress`
    // on the fly by merging all the entries together but it's more complex and computationally heavy.
    // We might change that in future if we're move memory-constrained.
    private readonly _orderHashesByMakerAddress: OrderHashesByMakerAddress = {};
    private readonly _orderHashesByERC20ByMakerAddress: OrderHashesByERC20ByMakerAddress = {};
    private readonly _orderHashesByERC721AddressByTokenIdByMakerAddress: OrderHashesByERC721AddressByTokenIdByMakerAddress = {};
    constructor(zrxTokenAddress: string) {
        this._zrxTokenAddress = zrxTokenAddress;
    }
    public getDependentOrderHashesByERC721ByMaker(makerAddress: string, tokenAddress: string): string[] {
        const orderHashSets = _.values(
            this._orderHashesByERC721AddressByTokenIdByMakerAddress[makerAddress][tokenAddress],
        );
        const orderHashList = _.reduce(
            orderHashSets,
            (accumulator, orderHashSet) => [...accumulator, ...orderHashSet],
            [] as string[],
        );
        const uniqueOrderHashList = _.uniq(orderHashList);
        return uniqueOrderHashList;
    }
    public getDependentOrderHashesByMaker(makerAddress: string): string[] {
        const dependentOrderHashes = Array.from(this._orderHashesByMakerAddress[makerAddress] || {});
        return dependentOrderHashes;
    }
    public getDependentOrderHashesByAssetDataByMaker(makerAddress: string, assetData: string): string[] {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        const dependentOrderHashes =
            decodedAssetData.assetProxyId === AssetProxyId.ERC20
                ? this._getDependentOrderHashesByERC20AssetData(makerAddress, assetData)
                : this._getDependentOrderHashesByERC721AssetData(makerAddress, assetData);
        return dependentOrderHashes;
    }
    public addToDependentOrderHashes(signedOrder: SignedOrder): void {
        const decodedMakerAssetData = assetDataUtils.decodeAssetDataOrThrow(signedOrder.makerAssetData);
        if (decodedMakerAssetData.assetProxyId === AssetProxyId.ERC20) {
            this._addToERC20DependentOrderHashes(signedOrder, (decodedMakerAssetData as ERC20AssetData).tokenAddress);
        } else {
            this._addToERC721DependentOrderHashes(
                signedOrder,
                (decodedMakerAssetData as ERC721AssetData).tokenAddress,
                (decodedMakerAssetData as ERC721AssetData).tokenId,
            );
        }
        this._addToERC20DependentOrderHashes(signedOrder, this._zrxTokenAddress);
        this._addToMakerDependentOrderHashes(signedOrder);
    }
    public removeFromDependentOrderHashes(signedOrder: SignedOrder): void {
        const decodedMakerAssetData = assetDataUtils.decodeAssetDataOrThrow(signedOrder.makerAssetData);
        if (decodedMakerAssetData.assetProxyId === AssetProxyId.ERC20) {
            this._removeFromERC20DependentOrderhashes(
                signedOrder,
                (decodedMakerAssetData as ERC20AssetData).tokenAddress,
            );
        } else {
            this._removeFromERC721DependentOrderhashes(
                signedOrder,
                (decodedMakerAssetData as ERC721AssetData).tokenAddress,
                (decodedMakerAssetData as ERC721AssetData).tokenId,
            );
        }
        // If makerToken === ZRX then we already removed it and we don't need to remove it again.
        if ((decodedMakerAssetData as ERC20AssetData).tokenAddress !== this._zrxTokenAddress) {
            this._removeFromERC20DependentOrderhashes(signedOrder, this._zrxTokenAddress);
        }
        this._removeFromMakerDependentOrderhashes(signedOrder);
    }
    private _getDependentOrderHashesByERC20AssetData(makerAddress: string, erc20AssetData: string): string[] {
        const tokenAddress = assetDataUtils.decodeERC20AssetData(erc20AssetData).tokenAddress;
        let dependentOrderHashes: string[] = [];
        if (
            !_.isUndefined(this._orderHashesByERC20ByMakerAddress[makerAddress]) &&
            !_.isUndefined(this._orderHashesByERC20ByMakerAddress[makerAddress][tokenAddress])
        ) {
            dependentOrderHashes = Array.from(this._orderHashesByERC20ByMakerAddress[makerAddress][tokenAddress]);
        }
        return dependentOrderHashes;
    }
    private _getDependentOrderHashesByERC721AssetData(makerAddress: string, erc721AssetData: string): string[] {
        const tokenAddress = assetDataUtils.decodeERC721AssetData(erc721AssetData).tokenAddress;
        const tokenId = assetDataUtils.decodeERC721AssetData(erc721AssetData).tokenId;
        let dependentOrderHashes: string[] = [];
        if (
            !_.isUndefined(this._orderHashesByERC721AddressByTokenIdByMakerAddress[makerAddress]) &&
            !_.isUndefined(this._orderHashesByERC721AddressByTokenIdByMakerAddress[makerAddress][tokenAddress]) &&
            !_.isUndefined(
                this._orderHashesByERC721AddressByTokenIdByMakerAddress[makerAddress][tokenAddress][tokenId.toString()],
            )
        ) {
            dependentOrderHashes = Array.from(
                this._orderHashesByERC721AddressByTokenIdByMakerAddress[makerAddress][tokenAddress][tokenId.toString()],
            );
        }
        return dependentOrderHashes;
    }
    private _addToERC20DependentOrderHashes(signedOrder: SignedOrder, erc20TokenAddress: string): void {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        if (_.isUndefined(this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress])) {
            this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress] = {};
        }
        if (_.isUndefined(this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress][erc20TokenAddress])) {
            this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress][erc20TokenAddress] = new Set();
        }
        this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress][erc20TokenAddress].add(orderHash);
    }
    private _addToERC721DependentOrderHashes(
        signedOrder: SignedOrder,
        erc721TokenAddress: string,
        tokenId: BigNumber,
    ): void {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        if (_.isUndefined(this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress])) {
            this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress] = {};
        }

        if (
            _.isUndefined(
                this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress],
            )
        ) {
            this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress] = {};
        }

        if (
            _.isUndefined(
                this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress][
                    tokenId.toString()
                ],
            )
        ) {
            this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress][
                tokenId.toString()
            ] = new Set();
        }

        this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress][
            tokenId.toString()
        ].add(orderHash);
    }
    private _addToMakerDependentOrderHashes(signedOrder: SignedOrder): void {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        if (_.isUndefined(this._orderHashesByMakerAddress[signedOrder.makerAddress])) {
            this._orderHashesByMakerAddress[signedOrder.makerAddress] = new Set();
        }
        this._orderHashesByMakerAddress[signedOrder.makerAddress].add(orderHash);
    }
    private _removeFromERC20DependentOrderhashes(signedOrder: SignedOrder, erc20TokenAddress: string): void {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress][erc20TokenAddress].delete(orderHash);

        if (_.isEmpty(this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress][erc20TokenAddress])) {
            delete this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress][erc20TokenAddress];
        }

        if (_.isEmpty(this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress])) {
            delete this._orderHashesByERC20ByMakerAddress[signedOrder.makerAddress];
        }
    }
    private _removeFromERC721DependentOrderhashes(
        signedOrder: SignedOrder,
        erc721TokenAddress: string,
        tokenId: BigNumber,
    ): void {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress][
            tokenId.toString()
        ].delete(orderHash);

        if (
            _.isEmpty(
                this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress][
                    tokenId.toString()
                ],
            )
        ) {
            delete this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][
                erc721TokenAddress
            ][tokenId.toString()];
        }

        if (
            _.isEmpty(
                this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][erc721TokenAddress],
            )
        ) {
            delete this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress][
                erc721TokenAddress
            ];
        }

        if (_.isEmpty(this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress])) {
            delete this._orderHashesByERC721AddressByTokenIdByMakerAddress[signedOrder.makerAddress];
        }
    }
    private _removeFromMakerDependentOrderhashes(signedOrder: SignedOrder): void {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        this._orderHashesByMakerAddress[signedOrder.makerAddress].delete(orderHash);

        if (_.isEmpty(this._orderHashesByMakerAddress[signedOrder.makerAddress])) {
            delete this._orderHashesByMakerAddress[signedOrder.makerAddress];
        }
    }
}
