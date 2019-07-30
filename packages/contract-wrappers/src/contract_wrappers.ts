import {
    Coordinator,
    DutchAuction,
    ERC20Proxy,
    ERC20Token,
    ERC721Proxy,
    ERC721Token,
    Exchange,
    Forwarder,
    OrderValidator,
    WETH9,
} from '@0x/contract-artifacts';
import { AbiDecoder } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { CoordinatorWrapper } from './contract_wrappers/coordinator_wrapper';
import { DutchAuctionWrapper } from './contract_wrappers/dutch_auction_wrapper';
import { ERC20ProxyWrapper } from './contract_wrappers/erc20_proxy_wrapper';
import { ERC20TokenWrapper } from './contract_wrappers/erc20_token_wrapper';
import { ERC721ProxyWrapper } from './contract_wrappers/erc721_proxy_wrapper';
import { ERC721TokenWrapper } from './contract_wrappers/erc721_token_wrapper';
import { EtherTokenWrapper } from './contract_wrappers/ether_token_wrapper';
import { ExchangeWrapper } from './contract_wrappers/exchange_wrapper';
import { ForwarderWrapper } from './contract_wrappers/forwarder_wrapper';
import { OrderValidatorWrapper } from './contract_wrappers/order_validator_wrapper';
import { ContractWrappersConfigSchema } from './schemas/contract_wrappers_config_schema';
import { ContractWrappersConfig } from './types';
import { assert } from './utils/assert';
import { constants } from './utils/constants';
import { _getDefaultContractAddresses } from './utils/contract_addresses';

/**
 * The ContractWrappers class contains smart contract wrappers helpful when building on 0x protocol.
 */
export class ContractWrappers {
    /**
     * An instance of the ExchangeWrapper class containing methods for interacting with the 0x Exchange smart contract.
     */
    public exchange: ExchangeWrapper;
    /**
     * An instance of the ERC20TokenWrapper class containing methods for interacting with any ERC20 token smart contract.
     */
    public erc20Token: ERC20TokenWrapper;
    /**
     * An instance of the ERC721TokenWrapper class containing methods for interacting with any ERC721 token smart contract.
     */
    public erc721Token: ERC721TokenWrapper;
    /**
     * An instance of the EtherTokenWrapper class containing methods for interacting with the
     * wrapped ETH ERC20 token smart contract.
     */
    public etherToken: EtherTokenWrapper;
    /**
     * An instance of the ERC20ProxyWrapper class containing methods for interacting with the
     * erc20Proxy smart contract.
     */
    public erc20Proxy: ERC20ProxyWrapper;
    /**
     * An instance of the ERC721ProxyWrapper class containing methods for interacting with the
     * erc721Proxy smart contract.
     */
    public erc721Proxy: ERC721ProxyWrapper;
    /**
     * An instance of the ForwarderWrapper class containing methods for interacting with any Forwarder smart contract.
     */
    public forwarder: ForwarderWrapper;
    /**
     * An instance of the OrderValidatorWrapper class containing methods for interacting with any OrderValidator smart contract.
     */
    public orderValidator: OrderValidatorWrapper;
    /**
     * An instance of the DutchAuctionWrapper class containing methods for interacting with any DutchAuction smart contract.
     */
    public dutchAuction: DutchAuctionWrapper;

    /**
     * An instance of the CoordinatorWrapper class containing methods for interacting with the Coordinator extension contract.
     */
    public coordinator: CoordinatorWrapper;

    private readonly _web3Wrapper: Web3Wrapper;
    /**
     * Instantiates a new ContractWrappers instance.
     * @param   supportedProvider    The Provider instance you would like the contract-wrappers library to use for interacting with
     *                      the Ethereum network.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the ContractWrappers class.
     */
    constructor(supportedProvider: SupportedProvider, config: ContractWrappersConfig) {
        assert.doesConformToSchema('config', config, ContractWrappersConfigSchema);
        const txDefaults = {
            gasPrice: config.gasPrice,
        };
        this._web3Wrapper = new Web3Wrapper(supportedProvider, txDefaults);
        const artifactsArray = [
            Coordinator,
            DutchAuction,
            ERC20Proxy,
            ERC20Token,
            ERC721Proxy,
            ERC721Token,
            Exchange,
            Forwarder,
            OrderValidator,
            WETH9,
        ];
        _.forEach(artifactsArray, artifact => {
            this._web3Wrapper.abiDecoder.addABI(artifact.compilerOutput.abi, artifact.contractName);
        });
        const blockPollingIntervalMs =
            config.blockPollingIntervalMs === undefined
                ? constants.DEFAULT_BLOCK_POLLING_INTERVAL
                : config.blockPollingIntervalMs;
        const contractAddresses =
            config.contractAddresses === undefined
                ? _getDefaultContractAddresses(config.networkId)
                : config.contractAddresses;
        this.erc20Proxy = new ERC20ProxyWrapper(this._web3Wrapper, config.networkId, contractAddresses.erc20Proxy);
        this.erc721Proxy = new ERC721ProxyWrapper(this._web3Wrapper, config.networkId, contractAddresses.erc721Proxy);
        this.erc20Token = new ERC20TokenWrapper(this._web3Wrapper, this.erc20Proxy, blockPollingIntervalMs);
        this.erc721Token = new ERC721TokenWrapper(this._web3Wrapper, this.erc721Proxy, blockPollingIntervalMs);
        this.etherToken = new EtherTokenWrapper(this._web3Wrapper, this.erc20Token, blockPollingIntervalMs);
        this.exchange = new ExchangeWrapper(
            this._web3Wrapper,
            config.networkId,
            this.erc20Token,
            this.erc721Token,
            contractAddresses.exchange,
            contractAddresses.zrxToken,
            blockPollingIntervalMs,
        );
        this.forwarder = new ForwarderWrapper(
            this._web3Wrapper,
            config.networkId,
            contractAddresses.forwarder,
            contractAddresses.zrxToken,
            contractAddresses.etherToken,
        );
        this.orderValidator = new OrderValidatorWrapper(
            this._web3Wrapper,
            config.networkId,
            contractAddresses.orderValidator,
        );
        this.dutchAuction = new DutchAuctionWrapper(
            this._web3Wrapper,
            config.networkId,
            contractAddresses.dutchAuction,
        );
        this.coordinator = new CoordinatorWrapper(
            this._web3Wrapper,
            config.networkId,
            contractAddresses.coordinator,
            contractAddresses.exchange,
            contractAddresses.coordinatorRegistry,
        );
    }
    /**
     * Unsubscribes from all subscriptions for all contracts.
     */
    public unsubscribeAll(): void {
        this.exchange.unsubscribeAll();
        this.erc20Token.unsubscribeAll();
        this.erc721Token.unsubscribeAll();
        this.etherToken.unsubscribeAll();
    }
    /**
     * Get the provider instance currently used by contract-wrappers
     * @return  Web3 provider instance
     */
    public getProvider(): SupportedProvider {
        return this._web3Wrapper.getProvider();
    }
    /**
     * Get the abi decoder instance currently used by contract-wrappers
     * @return  AbiDecoder instance
     */
    public getAbiDecoder(): AbiDecoder {
        return this._web3Wrapper.abiDecoder;
    }
}
