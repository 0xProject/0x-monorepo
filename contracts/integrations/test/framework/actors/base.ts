import { ERC1155MintableContract } from '@0x/contracts-erc1155';
import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { constants, getRandomInteger, TransactionFactory } from '@0x/contracts-test-utils';
import { SignatureType, SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { AssertionResult } from '../assertions/function_assertion';
import { DeploymentManager } from '../deployment_manager';
import { SimulationEnvironment } from '../simulation';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface ActorConfig {
    name?: string;
    deployment: DeploymentManager;
    simulationEnvironment?: SimulationEnvironment;
    [mixinProperty: string]: any;
}

export class Actor {
    public static count: number = 0;
    public readonly address: string;
    public readonly name: string;
    public readonly privateKey: Buffer;
    public readonly deployment: DeploymentManager;
    public readonly simulationEnvironment?: SimulationEnvironment;
    public simulationActions: {
        [action: string]: AsyncIterableIterator<AssertionResult | void>;
    } = {};
    protected readonly _transactionFactory: TransactionFactory;

    constructor(config: ActorConfig) {
        Actor.count++;
        this.address = config.deployment.accounts[Actor.count];
        this.name = config.name || this.address;
        this.deployment = config.deployment;
        this.privateKey = constants.TESTRPC_PRIVATE_KEYS[config.deployment.accounts.indexOf(this.address)];
        this.simulationEnvironment = config.simulationEnvironment;
        this._transactionFactory = new TransactionFactory(
            this.privateKey,
            config.deployment.exchange.address,
            config.deployment.chainId,
        );
    }

    /**
     * Sets a balance for an ERC20 token and approves a spender (defaults to the ERC20 asset proxy)
     * to transfer the token.
     */
    public async configureERC20TokenAsync(
        token: DummyERC20TokenContract | WETH9Contract,
        spender?: string,
        amount?: BigNumber,
    ): Promise<void> {
        if (token instanceof DummyERC20TokenContract) {
            await token
                .setBalance(this.address, amount || constants.INITIAL_ERC20_BALANCE)
                .awaitTransactionSuccessAsync();
        } else {
            await token.deposit().awaitTransactionSuccessAsync({
                from: this.address,
                value: amount || constants.ONE_ETHER,
            });
        }

        await token
            .approve(spender || this.deployment.assetProxies.erc20Proxy.address, constants.MAX_UINT256)
            .awaitTransactionSuccessAsync({ from: this.address });
    }

    /**
     * Mints some number of ERC721 NFTs and approves a spender (defaults to the ERC721 asset proxy)
     * to transfer the token.
     */
    public async configureERC721TokenAsync(
        token: DummyERC721TokenContract,
        spender?: string,
        numToMint: number = 1,
    ): Promise<BigNumber[]> {
        const tokenIds: BigNumber[] = [];
        _.times(numToMint, async () => {
            const tokenId = getRandomInteger(constants.ZERO_AMOUNT, constants.MAX_UINT256);
            await token.mint(this.address, tokenId).awaitTransactionSuccessAsync({
                from: this.address,
            });
            tokenIds.push(tokenId);
        });

        await token
            .setApprovalForAll(spender || this.deployment.assetProxies.erc721Proxy.address, true)
            .awaitTransactionSuccessAsync({
                from: this.address,
            });
        return tokenIds;
    }

    /**
     * Mints some number of ERC1115 fungible tokens and approves a spender (defaults to the ERC1155 asset proxy)
     * to transfer the token.
     */
    public async configureERC1155TokenAsync(
        token: ERC1155MintableContract,
        spender?: string,
        amount?: BigNumber,
    ): Promise<BigNumber> {
        // Create a fungible token.
        const id = await token.create.callAsync('', false, { from: this.address });
        await token.create.awaitTransactionSuccessAsync('', false, { from: this.address });

        // Mint the token
        await token.mintFungible.awaitTransactionSuccessAsync(
            id,
            [this.address],
            [amount || new BigNumber(constants.NUM_ERC1155_FUNGIBLE_TOKENS_MINT)],
            { from: this.address },
        );

        // Set approval for all token types for the spender.
        await token.setApprovalForAll.awaitTransactionSuccessAsync(
            spender || this.deployment.assetProxies.erc1155Proxy.address,
            true,
            { from: this.address },
        );

        return id;
    }

    /**
     * Signs a transaction.
     */
    public async signTransactionAsync(
        customTransactionParams: Partial<ZeroExTransaction>,
        signatureType: SignatureType = SignatureType.EthSign,
    ): Promise<SignedZeroExTransaction> {
        return this._transactionFactory.newSignedTransactionAsync(customTransactionParams, signatureType);
    }
}
