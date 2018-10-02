import { artifacts } from '@0xproject/contracts';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { ERC20ProxyWrapper } from './contract_wrappers/erc20_proxy_wrapper';
import { ERC20TokenWrapper } from './contract_wrappers/erc20_token_wrapper';
import { ERC721ProxyWrapper } from './contract_wrappers/erc721_proxy_wrapper';
import { ERC721TokenWrapper } from './contract_wrappers/erc721_token_wrapper';
import { EtherTokenWrapper } from './contract_wrappers/ether_token_wrapper';
import { ExchangeWrapper } from './contract_wrappers/exchange_wrapper';
import { ForwarderWrapper } from './contract_wrappers/forwarder_wrapper';
import { OrderValidatorWrapper } from './contract_wrappers/order_validator_wrapper';
import { ContractWrappersConfigSchema } from './schemas/contract_wrappers_config_schema';
import { contractWrappersPrivateNetworkConfigSchema } from './schemas/contract_wrappers_private_network_config_schema';
import { contractWrappersPublicNetworkConfigSchema } from './schemas/contract_wrappers_public_network_config_schema';
import { ContractWrappersConfig } from './types';
import { assert } from './utils/assert';
import { constants } from './utils/constants';
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

    private readonly _web3Wrapper: Web3Wrapper;
    /**
     * Instantiates a new ContractWrappers instance.
     * @param   provider    The Provider instance you would like the 0x.js library to use for interacting with
     *                      the Ethereum network.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the ContractWrappers class.
     */
    constructor(provider: Provider, config: ContractWrappersConfig) {
        assert.isWeb3Provider('provider', provider);
        assert.doesConformToSchema('config', config, ContractWrappersConfigSchema, [
            contractWrappersPrivateNetworkConfigSchema,
            contractWrappersPublicNetworkConfigSchema,
        ]);
        const artifactJSONs = _.values(artifacts);
        const abiArrays = _.map(artifactJSONs, artifact => artifact.compilerOutput.abi);
        const txDefaults = {
            gasPrice: config.gasPrice,
        };
        this._web3Wrapper = new Web3Wrapper(provider, txDefaults);
        _.forEach(abiArrays, abi => {
            this._web3Wrapper.abiDecoder.addABI(abi);
        });
        const blockPollingIntervalMs = _.isUndefined(config.blockPollingIntervalMs)
            ? constants.DEFAULT_BLOCK_POLLING_INTERVAL
            : config.blockPollingIntervalMs;
        this.erc20Proxy = new ERC20ProxyWrapper(this._web3Wrapper, config.networkId, config.erc20ProxyContractAddress);
        this.erc721Proxy = new ERC721ProxyWrapper(
            this._web3Wrapper,
            config.networkId,
            config.erc721ProxyContractAddress,
        );
        this.erc20Token = new ERC20TokenWrapper(
            this._web3Wrapper,
            config.networkId,
            this.erc20Proxy,
            blockPollingIntervalMs,
        );
        this.erc721Token = new ERC721TokenWrapper(
            this._web3Wrapper,
            config.networkId,
            this.erc721Proxy,
            blockPollingIntervalMs,
        );
        this.etherToken = new EtherTokenWrapper(
            this._web3Wrapper,
            config.networkId,
            this.erc20Token,
            blockPollingIntervalMs,
        );
        this.exchange = new ExchangeWrapper(
            this._web3Wrapper,
            config.networkId,
            this.erc20Token,
            this.erc721Token,
            config.exchangeContractAddress,
            config.zrxContractAddress,
            blockPollingIntervalMs,
        );
        this.forwarder = new ForwarderWrapper(
            this._web3Wrapper,
            config.networkId,
            config.forwarderContractAddress,
            config.zrxContractAddress,
        );
        this.orderValidator = new OrderValidatorWrapper(this._web3Wrapper, config.networkId);
    }
    /**
     * Sets a new web3 provider for 0x.js. Updating the provider will stop all
     * subscriptions so you will need to re-subscribe to all events relevant to your app after this call.
     * @param   provider    The Web3Provider you would like the 0x.js library to use from now on.
     * @param   networkId   The id of the network your provider is connected to
     */
    public setProvider(provider: Provider, networkId: number): void {
        this._web3Wrapper.setProvider(provider);
        (this.exchange as any)._invalidateContractInstances();
        (this.exchange as any)._setNetworkId(networkId);
        (this.erc20Token as any)._invalidateContractInstances();
        (this.erc20Token as any)._setNetworkId(networkId);
        (this.erc20Proxy as any)._invalidateContractInstance();
        (this.erc20Proxy as any)._setNetworkId(networkId);
        (this.etherToken as any)._invalidateContractInstance();
        (this.etherToken as any)._setNetworkId(networkId);
    }
    /**
     * Get the provider instance currently used by 0x.js
     * @return  Web3 provider instance
     */
    public getProvider(): Provider {
        return this._web3Wrapper.getProvider();
    }
}
