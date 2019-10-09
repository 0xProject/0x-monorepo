import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { constants, OrderFactory, BlockchainTestsEnvironment } from '@0x/contracts-test-utils';
import { assetDataUtils, Order, SignatureType, SignedOrder } from '@0x/order-utils';

import { DeploymentManager } from '../../src';

interface MarketMaker {
    address: string;
    orderFactory: OrderFactory;
}

interface ConfigurationArgs {
    address: string;
    mainToken: DummyERC20TokenContract;
    feeToken: DummyERC20TokenContract;
}

export class AddressManager {
    // A set of addresses that have been configured for market making.
    public makerAddresses: MarketMaker[];

    // A set of addresses that have been configured to take orders.
    public takerAddresses: string[];

    /**
     * Sets up an address to take orders.
     */
    public async addTakerAsync(deploymentManager: DeploymentManager, configArgs: ConfigurationArgs): Promise<void> {
        // Configure the taker address with the taker and fee tokens.
        await this._configureTokenForAddressAsync(deploymentManager, configArgs.address, configArgs.mainToken);
        await this._configureTokenForAddressAsync(deploymentManager, configArgs.address, configArgs.feeToken);

        // Add the taker to the list of configured taker addresses.
        this.takerAddresses.push(configArgs.address);
    }

    /**
     * Sets up a list of addresses to take orders.
     */
    public async addTakersAsync(deploymentManager: DeploymentManager, configArgs: ConfigurationArgs[]): Promise<void> {
        for (const args of configArgs) {
            await this.addTakerAsync(deploymentManager, args);
        }
    }

    /**
     * Sets up an address for market making.
     */
    public async addMakerAsync(
        deploymentManager: DeploymentManager,
        configArgs: ConfigurationArgs,
        environment: BlockchainTestsEnvironment,
        takerToken: DummyERC20TokenContract,
        feeRecipientAddress: string,
        chainId: number,
    ): Promise<void> {
        const accounts = await environment.getAccountAddressesAsync();

        // Set up order signing for the maker address.
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: configArgs.address,
            makerAssetData: assetDataUtils.encodeERC20AssetData(configArgs.mainToken.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(configArgs.feeToken.address),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(configArgs.feeToken.address),
            feeRecipientAddress,
            exchangeAddress: deploymentManager.exchange.address,
            chainId,
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(configArgs.address)];
        const orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        // Configure the maker address with the maker and fee tokens.
        await this._configureTokenForAddressAsync(deploymentManager, configArgs.address, configArgs.mainToken);
        await this._configureTokenForAddressAsync(deploymentManager, configArgs.address, configArgs.feeToken);

        // Add the maker to the list of configured maker addresses.
        this.makerAddresses.push({
            address: configArgs.address,
            orderFactory,
        });
    }

    /**
     * Sets up several market makers.
     */
    public async addMakersAsync(
        deploymentManager: DeploymentManager,
        configArgs: ConfigurationArgs[],
        environment: BlockchainTestsEnvironment,
        takerToken: DummyERC20TokenContract,
        feeRecipientAddress: string,
        chainId: number,
    ): Promise<void> {
        for (const args of configArgs) {
            await this.addMakerAsync(deploymentManager, args, environment, takerToken, feeRecipientAddress, chainId);
        }
    }

    /**
     * Sets up initial account balances for a token and approves the ERC20 asset proxy
     * to transfer the token.
     */
    protected async _configureTokenForAddressAsync(
        deploymentManager: DeploymentManager,
        address: string,
        token: DummyERC20TokenContract,
    ): Promise<void> {
        await token.setBalance.awaitTransactionSuccessAsync(address, constants.INITIAL_ERC20_BALANCE);
        await token.approve.awaitTransactionSuccessAsync(
            deploymentManager.assetProxies.erc20Proxy.address,
            constants.MAX_UINT256,
            { from: address },
        );
    }

    constructor(makers?: MarketMaker[], takers?: string[]) {
        this.makerAddresses = [];
        this.takerAddresses = [];
    }
}
