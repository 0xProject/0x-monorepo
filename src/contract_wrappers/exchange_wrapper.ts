import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {
    ECSignature,
    ExchangeContract,
    ExchangeContractErrs,
    OrderValues,
    OrderAddresses,
    SignedOrder,
    ContractEvent,
} from '../types';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as ExchangeArtifacts from '../artifacts/Exchange.json';
import {ecSignatureSchema} from '../schemas/ec_signature_schema';
import {signedOrderSchema} from '../schemas/signed_order_schema';
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
    public async fillOrderAsync(signedOrder: SignedOrder, fillAmount: BigNumber.BigNumber,
                                shouldCheckTransfer: boolean = true): Promise<ContractResponse> {
        assert.doesConformToSchema('signedOrder', JSON.parse(JSON.stringify(signedOrder)), signedOrderSchema);
        assert.isBoolean('shouldCheckTransfer', shouldCheckTransfer);

        const senderAddress = await this.web3Wrapper.getSenderAddressOrThrowAsync();
        const exchangeInstance = await this.getExchangeInstanceOrThrowAsync();

        const taker = _.isUndefined(signedOrder.taker) ? constants.NULL_ADDRESS : signedOrder.taker;

        const orderAddresses: OrderAddresses = [
            signedOrder.maker,
            taker,
            signedOrder.makerTokenAddress,
            signedOrder.takerTokenAddress,
            signedOrder.feeRecipient,
        ];
        const orderValues: OrderValues = [
            signedOrder.makerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerFee,
            signedOrder.takerFee,
            signedOrder.expirationUnixTimestampSec,
            signedOrder.salt,
        ];
        const response: ContractResponse = await exchangeInstance.fill(
            orderAddresses,
            orderValues,
            fillAmount,
            shouldCheckTransfer,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: senderAddress,
            },
        );
        this.throwErrorLogsAsErrors(response.logs);
        return response;
    }
    private async getExchangeInstanceOrThrowAsync(): Promise<ExchangeContract> {
        const contractInstance = await this.instantiateContractIfExistsAsync((ExchangeArtifacts as any));
        return contractInstance as ExchangeContract;
    }
    private throwErrorLogsAsErrors(logs: ContractEvent[]): void {
        const errEvent = _.find(logs, {event: 'LogError'});
        if (!_.isUndefined(errEvent)) {
            const errCode = errEvent.args.errorId.toNumber();
            const humanReadableErrMessage = this.exchangeContractErrToMsg[errCode];
            throw new Error(humanReadableErrMessage);
        }
    }
}
