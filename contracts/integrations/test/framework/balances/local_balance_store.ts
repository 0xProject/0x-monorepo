import {
    decodeERC1155AssetData,
    decodeERC20AssetData,
    decodeERC20BridgeAssetData,
    decodeERC721AssetData,
    decodeMultiAssetData,
    encodeERC20AssetData,
} from '@0x/contracts-asset-proxy';
import { ReferenceFunctions } from '@0x/contracts-exchange-libs';
import { constants, Numberish } from '@0x/contracts-test-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from '../deployment_manager';

import { BalanceStore } from './balance_store';
import { TokenContractsByName, TokenOwnersByName } from './types';

export class LocalBalanceStore extends BalanceStore {
    /**
     * Creates a new balance store based on an existing one.
     * @param sourceBalanceStore Existing balance store whose values should be copied.
     */
    public static create(sourceBalanceStore?: BalanceStore): LocalBalanceStore {
        const localBalanceStore = new LocalBalanceStore();
        if (sourceBalanceStore !== undefined) {
            localBalanceStore.cloneFrom(sourceBalanceStore);
        }
        return localBalanceStore;
    }

    /**
     * Constructor.
     * Note that parameters are given {} defaults because `LocalBalanceStore`s will typically
     * be initialized via `create`.
     */
    protected constructor(
        tokenOwnersByName: TokenOwnersByName = {},
        tokenContractsByName: Partial<TokenContractsByName> = {},
    ) {
        super(tokenOwnersByName, tokenContractsByName);
    }

    /**
     * Decreases the ETH balance of an address to simulate gas usage.
     * @param senderAddress Address whose ETH balance to decrease.
     * @param amount Amount to decrease the balance by.
     */
    public burnGas(senderAddress: string, amount: Numberish): void {
        this.balances.eth[senderAddress] = this.balances.eth[senderAddress].minus(amount);
    }

    /**
     * Converts some amount of the ETH balance of an address to WETH balance to simulate wrapping ETH.
     * @param senderAddress Address whose ETH to wrap.
     * @param amount Amount to wrap.
     */
    public wrapEth(senderAddress: string, wethAddress: string, amount: Numberish): void {
        this.balances.eth[senderAddress] = this.balances.eth[senderAddress].minus(amount);
        _.update(this.balances.erc20, [senderAddress, wethAddress], balance =>
            (balance || constants.ZERO_AMOUNT).plus(amount),
        );
    }

    /**
     * Converts some amount of the ETH balance of an address to WETH balance to simulate wrapping ETH.
     * @param senderAddress Address whose ETH to wrap.
     * @param amount Amount to wrap.
     */
    public unwrapEth(senderAddress: string, wethAddress: string, amount: Numberish): void {
        this.balances.eth[senderAddress] = this.balances.eth[senderAddress].plus(amount);
        _.update(this.balances.erc20, [senderAddress, wethAddress], balance => balance.minus(amount));
    }

    /**
     * Sends ETH from `fromAddress` to `toAddress`.
     * @param fromAddress Sender of ETH.
     * @param toAddress Receiver of ETH.
     * @param amount Amount of ETH to transfer.
     */
    public sendEth(fromAddress: string, toAddress: string, amount: Numberish): void {
        this.balances.eth[toAddress] = this.balances.eth[toAddress] || constants.ZERO_AMOUNT;
        this.balances.eth[fromAddress] = this.balances.eth[fromAddress].minus(amount);
        this.balances.eth[toAddress] = this.balances.eth[toAddress].plus(amount);
    }

    /**
     * Transfers assets from `fromAddress` to `toAddress`.
     * @param fromAddress Sender of asset(s)
     * @param toAddress Receiver of asset(s)
     * @param amount Amount of asset(s) to transfer
     * @param assetData Asset data of assets being transferred.
     */
    public transferAsset(fromAddress: string, toAddress: string, amount: BigNumber, assetData: string): void {
        if (fromAddress === toAddress || amount.isZero()) {
            return;
        }
        const assetProxyId = hexUtils.slice(assetData, 0, 4);
        switch (assetProxyId) {
            case AssetProxyId.ERC20: {
                const tokenAddress = decodeERC20AssetData(assetData);
                _.update(this.balances.erc20, [fromAddress, tokenAddress], balance => balance.minus(amount));
                _.update(this.balances.erc20, [toAddress, tokenAddress], balance =>
                    (balance || constants.ZERO_AMOUNT).plus(amount),
                );
                break;
            }
            case AssetProxyId.ERC20Bridge: {
                const [tokenAddress] = decodeERC20BridgeAssetData(assetData);
                // The test bridge contract (TestEth2DaiBridge or TestUniswapBridge) will be the
                // fromAddress in this case, and it simply mints the amount of token it needs to transfer.
                _.update(this.balances.erc20, [fromAddress, tokenAddress], balance =>
                    (balance || constants.ZERO_AMOUNT).minus(amount),
                );
                _.update(this.balances.erc20, [toAddress, tokenAddress], balance =>
                    (balance || constants.ZERO_AMOUNT).plus(amount),
                );
                break;
            }
            case AssetProxyId.ERC721: {
                const [tokenAddress, tokenId] = decodeERC721AssetData(assetData);
                const fromTokens = _.get(this.balances.erc721, [fromAddress, tokenAddress], []);
                const toTokens = _.get(this.balances.erc721, [toAddress, tokenAddress], []);
                if (amount.gte(1)) {
                    const tokenIndex = _.findIndex(fromTokens as BigNumber[], t => t.eq(tokenId));
                    if (tokenIndex !== -1) {
                        fromTokens.splice(tokenIndex, 1);
                        toTokens.push(tokenId);
                        toTokens.sort();
                    }
                }
                _.set(this.balances.erc721, [fromAddress, tokenAddress], fromTokens);
                _.set(this.balances.erc721, [toAddress, tokenAddress], toTokens);
                break;
            }
            case AssetProxyId.ERC1155: {
                const [tokenAddress, tokenIds, tokenValues] = decodeERC1155AssetData(assetData);
                const fromBalances = {
                    // tslint:disable-next-line:no-inferred-empty-object-type
                    fungible: _.get(this.balances.erc1155, [fromAddress, tokenAddress, 'fungible'], {}),
                    nonFungible: _.get(this.balances.erc1155, [fromAddress, tokenAddress, 'nonFungible'], []),
                };
                const toBalances = {
                    // tslint:disable-next-line:no-inferred-empty-object-type
                    fungible: _.get(this.balances.erc1155, [toAddress, tokenAddress, 'fungible'], {}),
                    nonFungible: _.get(this.balances.erc1155, [toAddress, tokenAddress, 'nonFungible'], []),
                };
                for (const [i, tokenId] of tokenIds.entries()) {
                    const tokenValue = tokenValues[i];
                    const tokenAmount = amount.times(tokenValue);
                    if (tokenAmount.gt(0)) {
                        const tokenIndex = _.findIndex(fromBalances.nonFungible as BigNumber[], t => t.eq(tokenId));
                        if (tokenIndex !== -1) {
                            // Transfer a non-fungible.
                            fromBalances.nonFungible.splice(tokenIndex, 1);
                            toBalances.nonFungible.push(tokenId);
                            // sort NFT's by name
                            toBalances.nonFungible.sort();
                        } else {
                            // Transfer a fungible.
                            const _tokenId = tokenId.toString();
                            _.update(fromBalances.fungible, [_tokenId], balance => balance.minus(tokenAmount));
                            _.update(toBalances.fungible, [_tokenId], balance =>
                                (balance || constants.ZERO_AMOUNT).plus(tokenAmount),
                            );
                        }
                    }
                }
                _.set(this.balances.erc1155, [fromAddress, tokenAddress], fromBalances);
                _.set(this.balances.erc1155, [toAddress, tokenAddress], toBalances);
                break;
            }
            case AssetProxyId.MultiAsset: {
                const [amounts, nestedAssetData] = decodeMultiAssetData(assetData);
                for (const [i, amt] of amounts.entries()) {
                    const nestedAmount = amount.times(amt);
                    this.transferAsset(fromAddress, toAddress, nestedAmount, nestedAssetData[i]);
                }
                break;
            }
            case AssetProxyId.StaticCall:
                // Do nothing
                break;
            default:
                throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`);
        }
    }

    public simulateFills(
        orders: SignedOrder[],
        takerAddresses: string[] | string,
        txReceipt: TransactionReceiptWithDecodedLogs,
        deployment: DeploymentManager,
        msgValue: BigNumber = constants.ZERO_AMOUNT,
        takerAssetFillAmounts?: BigNumber[],
    ): void {
        let remainingValue = msgValue;
        // Transaction gas cost
        this.burnGas(txReceipt.from, DeploymentManager.gasPrice.times(txReceipt.gasUsed));

        for (const [index, order] of orders.entries()) {
            const takerAddress = Array.isArray(takerAddresses) ? takerAddresses[index] : takerAddresses;
            const fillResults = ReferenceFunctions.calculateFillResults(
                order,
                takerAssetFillAmounts ? takerAssetFillAmounts[index] : order.takerAssetAmount,
                DeploymentManager.protocolFeeMultiplier,
                DeploymentManager.gasPrice,
            );

            // Taker -> Maker
            this.transferAsset(
                takerAddress,
                order.makerAddress,
                fillResults.takerAssetFilledAmount,
                order.takerAssetData,
            );
            // Maker -> Taker
            this.transferAsset(
                order.makerAddress,
                takerAddress,
                fillResults.makerAssetFilledAmount,
                order.makerAssetData,
            );
            // Taker -> Fee Recipient
            this.transferAsset(
                takerAddress,
                order.feeRecipientAddress,
                fillResults.takerFeePaid,
                order.takerFeeAssetData,
            );
            // Maker -> Fee Recipient
            this.transferAsset(
                order.makerAddress,
                order.feeRecipientAddress,
                fillResults.makerFeePaid,
                order.makerFeeAssetData,
            );

            // Protocol fee
            if (remainingValue.isGreaterThanOrEqualTo(fillResults.protocolFeePaid)) {
                this.sendEth(txReceipt.from, deployment.staking.stakingProxy.address, fillResults.protocolFeePaid);
                remainingValue = remainingValue.minus(fillResults.protocolFeePaid);
            } else {
                this.transferAsset(
                    takerAddress,
                    deployment.staking.stakingProxy.address,
                    fillResults.protocolFeePaid,
                    encodeERC20AssetData(deployment.tokens.weth.address),
                );
            }
        }
    }
}
