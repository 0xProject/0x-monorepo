import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {
    ECSignature,
    ExchangeContract,
    ExchangeContractErrs,
    OrderValues,
    OrderAddresses,
} from '../types';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as ExchangeArtifacts from '../artifacts/Exchange.json';
import {ecSignatureSchema} from '../schemas/ec_signature_schema';
import {ContractResponse} from '../types';
import {constants} from '../utils/constants';

export class ExchangeWrapper extends ContractWrapper {
    private exchangeContractErrToMsg = {
        [ExchangeContractErrs.ERROR_FILL_EXPIRED]: 'The order you attempted to fill is expired',
        [ExchangeContractErrs.ERROR_CANCEL_EXPIRED]: 'The order you attempted to cancel is expired',
        [ExchangeContractErrs.ERROR_FILL_NO_VALUE]: 'This order has already been filled or cancelled',
        [ExchangeContractErrs.ERROR_CANCEL_NO_VALUE]: 'This order has already been filled or cancelled',
        [ExchangeContractErrs.ERROR_FILL_TRUNCATION]: 'The rounding error was too large when filling this order',
        [ExchangeContractErrs.ERROR_FILL_BALANCE_ALLOWANCE]: 'Maker or taker has insufficient balance or allowance',
    };
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
    }
    public async isValidSignatureAsync(dataHex: string, ecSignature: ECSignature,
                                       signerAddressHex: string): Promise<boolean> {
        assert.isHexString('dataHex', dataHex);
        assert.doesConformToSchema('ecSignature', ecSignature, ecSignatureSchema);
        assert.isETHAddressHex('signerAddressHex', signerAddressHex);

        const senderAddress = await this.web3Wrapper.getSenderAddressOrThrowAsync();
        const exchangeInstance = await this.getExchangeInstanceOrThrowAsync();

        const isValidSignature = await exchangeInstance.isValidSignature.call(
            signerAddressHex,
            dataHex,
            ecSignature.v,
            ecSignature.r,
            ecSignature.s,
            {
                from: senderAddress,
            },
        );
        return isValidSignature;
    }
    public async fillOrderAsync(maker: string, taker: string, makerTokenAddress: string,
                                takerTokenAddress: string, makerTokenAmount: BigNumber.BigNumber,
                                takerTokenAmount: BigNumber.BigNumber, makerFee: BigNumber.BigNumber,
                                takerFee: BigNumber.BigNumber, expirationUnixTimestampSec: BigNumber.BigNumber,
                                feeRecipient: string, fillAmount: BigNumber.BigNumber,
                                ecSignature: ECSignature, salt: BigNumber.BigNumber) {
        assert.isBigNumber('salt', salt);
        assert.isBigNumber('makerFee', makerFee);
        assert.isBigNumber('takerFee', takerFee);
        assert.isBigNumber('fillAmount', fillAmount);
        assert.isBigNumber('makerTokenAmount', makerTokenAmount);
        assert.isBigNumber('takerTokenAmount', takerTokenAmount);
        assert.isBigNumber('expirationUnixTimestampSec', expirationUnixTimestampSec);
        assert.isETHAddressHex('maker', maker);
        assert.isETHAddressHex('taker', taker);
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
        assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
        assert.doesConformToSchema('ecSignature', ecSignature, ecSignatureSchema);

        const senderAddress = await this.web3Wrapper.getSenderAddressOrThrowAsync();
        const exchangeInstance = await this.getExchangeInstanceOrThrowAsync();

        taker = taker === '' ? constants.NULL_ADDRESS : taker;
        const shouldCheckTransfer = true;
        const orderAddresses: OrderAddresses = [
            maker,
            taker,
            makerTokenAddress,
            takerTokenAddress,
            feeRecipient,
        ];
        const orderValues: OrderValues = [
            makerTokenAmount,
            takerTokenAmount,
            makerFee,
            takerFee,
            expirationUnixTimestampSec,
            salt,
        ];
        const response: ContractResponse = await exchangeInstance.fill(
            orderAddresses,
            orderValues,
            fillAmount,
            shouldCheckTransfer,
            ecSignature.v,
            ecSignature.r,
            ecSignature.s,
            {
                from: senderAddress,
            },
        );
        const errEvent = _.find(response.logs, {event: 'LogError'});
        if (!_.isUndefined(errEvent)) {
            const errCode = errEvent.args.errorId.toNumber();
            const humanReadableErrMessage = this.exchangeContractErrToMsg[errCode];
            throw new Error(humanReadableErrMessage);
        }
        return response;
    }
    private async getExchangeInstanceOrThrowAsync(): Promise<ExchangeContract> {
        const contractInstance = await this.instantiateContractIfExistsAsync((ExchangeArtifacts as any));
        return contractInstance as ExchangeContract;
    }
}
