import { ContractAddresses } from '@0x/contract-addresses';
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

import { CoordinatorWrapper } from './coordinator_wrapper';
import { DutchAuctionContract } from './generated-wrappers/dutch_auction';
import { ERC20ProxyContract } from './generated-wrappers/erc20_proxy';
import { ERC721ProxyContract } from './generated-wrappers/erc721_proxy';
import { ExchangeContract } from './generated-wrappers/exchange';
import { ForwarderContract } from './generated-wrappers/forwarder';
import { OrderValidatorContract } from './generated-wrappers/order_validator';
import { WETH9Contract } from './generated-wrappers/weth9';
import { ContractWrappersConfigSchema } from './schemas/contract_wrappers_config_schema';
import { ContractWrappersConfig } from './types';
import { assert } from './utils/assert';
import { constants as wrapperConstants } from './utils/constants';
import { _getDefaultContractAddresses } from './utils/contract_addresses';

/**
 * The ContractWrappers class contains smart contract wrappers helpful when building on 0x protocol.
 */
export class ContractWrappers {
    /**
     * An index of the default contract addresses for this network.
     */
    public contractAddresses: ContractAddresses;
    /**
     * An instance of the ExchangeContract class containing methods for interacting with the 0x Exchange smart contract.
     */
    public exchange: ExchangeContract;
    /**
     * An instance of the ERC20ProxyContract class containing methods for interacting with the
     * erc20Proxy smart contract.
     */
    public erc20Proxy: ERC20ProxyContract;
    /**
     * An instance of the ERC721ProxyContract class containing methods for interacting with the
     * erc721Proxy smart contract.
     */
    public erc721Proxy: ERC721ProxyContract;
    /**
     * An instance of the WETH9Contract class containing methods for interacting with the
     * WETH9 smart contract.
     */
    public weth9: WETH9Contract;
    /**
     * An instance of the ForwarderContract class containing methods for interacting with any Forwarder smart contract.
     */
    public forwarder: ForwarderContract;
    /**
     * An instance of the OrderValidatorContract class containing methods for interacting with any OrderValidator smart contract.
     */
    public orderValidator: OrderValidatorContract;
    /**
     * An instance of the DutchAuctionContract class containing methods for interacting with any DutchAuction smart contract.
     */
    public dutchAuction: DutchAuctionContract;
    /**
     * An instance of the CoordinatorWrapper class containing methods for interacting with the Coordinator extension contract.
     */
    public coordinator: CoordinatorWrapper;

    public constants: { [key: string]: any } = wrapperConstants;

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
        const contractAddresses =
            config.contractAddresses === undefined
                ? _getDefaultContractAddresses(config.networkId)
                : config.contractAddresses;
        this.erc20Proxy = new ERC20ProxyContract(contractAddresses.erc20Proxy, this.getProvider());
        this.erc721Proxy = new ERC721ProxyContract(contractAddresses.erc721Proxy, this.getProvider());
        this.weth9 = new WETH9Contract(contractAddresses.etherToken, this.getProvider());
        this.exchange = new ExchangeContract(contractAddresses.exchange, this.getProvider());
        this.forwarder = new ForwarderContract(contractAddresses.forwarder, this.getProvider());
        this.orderValidator = new OrderValidatorContract(contractAddresses.orderValidator, this.getProvider());
        this.dutchAuction = new DutchAuctionContract(contractAddresses.dutchAuction, this.getProvider());
        this.coordinator = new CoordinatorWrapper(
            this._web3Wrapper,
            config.networkId,
            contractAddresses.coordinator,
            contractAddresses.exchange,
            contractAddresses.coordinatorRegistry,
        );
        this.contractAddresses = contractAddresses;
    }
    /**
     * Unsubscribes from all subscriptions for all contracts.
     */
    public unsubscribeAll(): void {
        this.exchange.unsubscribeAll();
        this.erc20Proxy.unsubscribeAll();
        this.erc721Proxy.unsubscribeAll();
        this.weth9.unsubscribeAll();
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
