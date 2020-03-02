"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("@0x/assert");
var web3_wrapper_1 = require("@0x/web3-wrapper");
var contract_wrappers_config_schema_1 = require("./contract_wrappers_config_schema");
var coordinator_1 = require("./generated-wrappers/coordinator");
var dev_utils_1 = require("./generated-wrappers/dev_utils");
var erc20_token_1 = require("./generated-wrappers/erc20_token");
var erc721_token_1 = require("./generated-wrappers/erc721_token");
var exchange_1 = require("./generated-wrappers/exchange");
var forwarder_1 = require("./generated-wrappers/forwarder");
var staking_1 = require("./generated-wrappers/staking");
var weth9_1 = require("./generated-wrappers/weth9");
var contract_addresses_1 = require("./utils/contract_addresses");
/**
 * The ContractWrappers class contains smart contract wrappers helpful when building on 0x protocol.
 */
var ContractWrappers = /** @class */ (function () {
    /**
     * Instantiates a new ContractWrappers instance.
     * @param   supportedProvider    The Provider instance you would like the contract-wrappers library to use for interacting with
     *                      the Ethereum network.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the ContractWrappers class.
     */
    function ContractWrappers(supportedProvider, config) {
        var _this = this;
        assert_1.assert.doesConformToSchema('config', config, contract_wrappers_config_schema_1.ContractWrappersConfigSchema);
        var txDefaults = {
            gasPrice: config.gasPrice,
        };
        this._web3Wrapper = new web3_wrapper_1.Web3Wrapper(supportedProvider, txDefaults);
        var contractsArray = [
            coordinator_1.CoordinatorContract,
            dev_utils_1.DevUtilsContract,
            erc20_token_1.ERC20TokenContract,
            erc721_token_1.ERC721TokenContract,
            exchange_1.ExchangeContract,
            forwarder_1.ForwarderContract,
            staking_1.StakingContract,
            weth9_1.WETH9Contract,
        ];
        contractsArray.forEach(function (contract) {
            _this._web3Wrapper.abiDecoder.addABI(contract.ABI(), contract.contractName);
        });
        var contractAddresses = config.contractAddresses === undefined
            ? contract_addresses_1._getDefaultContractAddresses(config.chainId)
            : config.contractAddresses;
        this.weth9 = new weth9_1.WETH9Contract(contractAddresses.etherToken, this.getProvider());
        this.exchange = new exchange_1.ExchangeContract(contractAddresses.exchange, this.getProvider());
        this.forwarder = new forwarder_1.ForwarderContract(contractAddresses.forwarder, this.getProvider());
        this.staking = new staking_1.StakingContract(contractAddresses.stakingProxy, this.getProvider());
        this.devUtils = new dev_utils_1.DevUtilsContract(contractAddresses.devUtils, this.getProvider());
        this.coordinator = new coordinator_1.CoordinatorContract(contractAddresses.coordinator, this.getProvider());
        this.contractAddresses = contractAddresses;
    }
    /**
     * Unsubscribes from all subscriptions for all contracts.
     */
    ContractWrappers.prototype.unsubscribeAll = function () {
        this.exchange.unsubscribeAll();
        this.weth9.unsubscribeAll();
    };
    /**
     * Get the provider instance currently used by contract-wrappers
     * @return  Web3 provider instance
     */
    ContractWrappers.prototype.getProvider = function () {
        return this._web3Wrapper.getProvider();
    };
    /**
     * Get the abi decoder instance currently used by contract-wrappers
     * @return  AbiDecoder instance
     */
    ContractWrappers.prototype.getAbiDecoder = function () {
        return this._web3Wrapper.abiDecoder;
    };
    return ContractWrappers;
}());
exports.ContractWrappers = ContractWrappers;
//# sourceMappingURL=contract_wrappers.js.map