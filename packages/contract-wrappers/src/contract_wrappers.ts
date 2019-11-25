import { assert } from '@0x/assert';
import { ContractAddresses } from '@0x/contract-addresses';
import {
    Coordinator,
    DevUtils,
    DutchAuction,
    ERC20Token,
    ERC721Token,
    Exchange,
    Forwarder,
    OrderValidator,
    WETH9,
} from '@0x/contract-artifacts';
import { AbiDecoder } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';

import { ContractWrappersConfigSchema } from './contract_wrappers_config_schema';
import { CoordinatorContract } from './generated-wrappers/coordinator';
import { DevUtilsContract } from './generated-wrappers/dev_utils';
import { ExchangeContract } from './generated-wrappers/exchange';
import { ForwarderContract } from './generated-wrappers/forwarder';
import { OrderValidatorContract } from './generated-wrappers/order_validator';
import { WETH9Contract } from './generated-wrappers/weth9';

import { ContractWrappersConfig } from './types';
import { _getDefaultContractAddresses } from './utils/contract_addresses';

/**
 * The ContractWrappers class contains smart contract wrappers helpful when building on 0x protocol.
 */
export class ContractWrappers {
    /**
     * An index of the default contract addresses for this chain.
     */
    public contractAddresses: ContractAddresses;
    /**
     * An instance of the ExchangeContract class containing methods for interacting with the 0x Exchange smart contract.
     */
    public exchange: ExchangeContract;
    /**
     * An instance of the WETH9Contract class containing methods for interacting with the
     * WETH9 smart contract.
     */
    public weth9: WETH9Contract;
    /**
     * An instance of the ForwarderContract class containing methods for interacting with any Forwarder smart contract.
     */
    public forwarder: ForwarderContract;
    // TODO(fabio): Remove orderValidator after @0x/asset-buyer is deleted
    /**
     * An instance of the OrderValidatorContract class containing methods for interacting with any OrderValidator smart contract.
     */
    public orderValidator: OrderValidatorContract;
    /**
     * An instance of the DevUtilsContract class containing methods for interacting with the DevUtils smart contract.
     */
    public devUtils: DevUtilsContract;
    /**
     * An instance of the CoordinatorContract class containing methods for interacting with the Coordinator extension contract.
     */
    public coordinator: CoordinatorContract;

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
            DevUtils,
            DutchAuction,
            ERC20Token,
            ERC721Token,
            Exchange,
            Forwarder,
            OrderValidator,
            WETH9,
        ];
        artifactsArray.forEach(artifact => {
            this._web3Wrapper.abiDecoder.addABI(artifact.compilerOutput.abi, artifact.contractName);
        });
        const contractAddresses =
            config.contractAddresses === undefined
                ? _getDefaultContractAddresses(config.chainId)
                : config.contractAddresses;
        this.weth9 = new WETH9Contract(contractAddresses.etherToken, this.getProvider());
        this.exchange = new ExchangeContract(contractAddresses.exchange, this.getProvider());
        this.forwarder = new ForwarderContract(contractAddresses.forwarder, this.getProvider());
        this.orderValidator = new OrderValidatorContract(contractAddresses.orderValidator, this.getProvider());
        this.devUtils = new DevUtilsContract(contractAddresses.devUtils, this.getProvider());
        this.coordinator = new CoordinatorContract(contractAddresses.coordinator, this.getProvider());
        this.contractAddresses = contractAddresses;
    }
    /**
     * Unsubscribes from all subscriptions for all contracts.
     */
    public unsubscribeAll(): void {
        this.exchange.unsubscribeAll();
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
