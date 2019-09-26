// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, PromiseWithTransactionHash } from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    BlockRange,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    MethodAbi,
    TransactionReceiptWithDecodedLogs,
    TxData,
    TxDataPayable,
    SupportedProvider,
} from 'ethereum-types';
import { BigNumber, classUtils, logUtils, providerUtils } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ForwarderContract extends BaseContract {
    public static deployedBytecode =
        '0x6080604052600436106100655760003560e01c8063942d33c011610043578063942d33c014610102578063ae93b97a14610124578063f2fde38b1461013757610065565b8063442026ed14610097578063630f1e6c146100b75780638da5cb5b146100d7575b60025473ffffffffffffffffffffffffffffffffffffffff1633146100955761009561009033610157565b6101f6565b005b3480156100a357600080fd5b506100956100b2366004611b5e565b6101fe565b3480156100c357600080fd5b506100956100d2366004611ba0565b6104a8565b3480156100e357600080fd5b506100ec6104f1565b6040516100f99190611ce7565b60405180910390f35b610115610110366004611ab3565b61050d565b6040516100f993929190611f9b565b610115610132366004611a36565b610565565b34801561014357600080fd5b506100956101523660046119fc565b6105e3565b60606308b1869860e01b826040516024016101729190611ce7565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909316929092179091529050919050565b805160208201fd5b600061024a600084848080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929392505063ffffffff61065a169050565b905060405161025890611cbe565b60405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614156104a35760015460405160009173ffffffffffffffffffffffffffffffffffffffff16906360704108906102d490611cbe565b6040519081900381207fffffffff0000000000000000000000000000000000000000000000000000000060e084901b16825261031291600401611d86565b60206040518083038186803b15801561032a57600080fd5b505afa15801561033e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052506103629190810190611a19565b905073ffffffffffffffffffffffffffffffffffffffff811661038a5761038a6100906106b0565b60006103d6601086868080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929392505063ffffffff61070a169050565b6040517f095ea7b300000000000000000000000000000000000000000000000000000000815290915073ffffffffffffffffffffffffffffffffffffffff82169063095ea7b39061044d9085907fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff90600401611d08565b602060405180830381600087803b15801561046757600080fd5b505af115801561047b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525061049f9190810190611b3c565b5050505b505050565b6104b061074a565b6104a383838080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250859250610793915050565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b600080600061051a61087e565b610525888888610913565b9093509150610535838686610a9b565b905061055a8860008151811061054757fe5b6020026020010151610140015183610793565b955095509592505050565b600080600061057261087e565b6000610596670de0b6b3a7640000610590888263ffffffff610c3a16565b34610c5d565b90506105a3888289610c87565b90945092506105b3848787610a9b565b91506105d8886000815181106105c557fe5b6020026020010151610140015184610793565b509450945094915050565b6105eb61074a565b73ffffffffffffffffffffffffffffffffffffffff811661061657610611610090610d9b565b610657565b600080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff83161790555b50565b6000816004018351101561067b5761067b6100906003855185600401610dd2565b5060208183018101519101907fffffffff00000000000000000000000000000000000000000000000000000000165b92915050565b6040805160048152602481019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167ff3b96b8d0000000000000000000000000000000000000000000000000000000017905290565b6000816014018351101561072b5761072b6100906004855185601401610dd2565b50016014015173ffffffffffffffffffffffffffffffffffffffff1690565b60005473ffffffffffffffffffffffffffffffffffffffff163314610791576000546107919061009090339073ffffffffffffffffffffffffffffffffffffffff16610e77565b565b60006107a5838263ffffffff61065a16565b90506040516107b390611cbe565b60405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916141561080f5761080a8383610f19565b6104a3565b60405161081b90611c6c565b60405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614156108725761080a8383611081565b6104a36100908261114e565b3461088e5761088e610090611169565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663d0e30db0346040518263ffffffff1660e01b81526004016000604051808303818588803b1580156108f857600080fd5b505af115801561090c573d6000803e3d6000fd5b5050505050565b82516000908190815b818114610a7c576109678760008151811061093357fe5b6020026020010151610140015188838151811061094c57fe5b602002602001015161014001516111c390919063ffffffff16565b6109a9576109a96100908860008151811061097e57fe5b6020026020010151610140015189848151811061099757fe5b602002602001015161014001516111e9565b8681815181106109b557fe5b602002602001015160800151600014806109e657508681815181106109d657fe5b602002602001015160a001516000145b156109f057610a74565b6000610a02878563ffffffff61120616565b9050600080610a388a8581518110610a1657fe5b6020026020010151898681518110610a2a57fe5b602002602001015185611225565b9092509050610a4d878363ffffffff610c3a16565b9650610a5f868263ffffffff610c3a16565b9550888610610a7057505050610a7c565b5050505b60010161091c565b5084821015610a9257610a92610090868461134e565b50935093915050565b600066b1a2bc2ec50000831115610ab857610ab86100908461136b565b34841115610acd57610acd6100908534611386565b6000610adf348663ffffffff61120616565b9050610af484670de0b6b3a764000087610c5d565b915080821115610b0b57610b0b61009083836113a3565b8015610c32576002546040517f2e1a7d4d00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff90911690632e1a7d4d90610b67908490600401611f84565b600060405180830381600087803b158015610b8157600080fd5b505af1158015610b95573d6000803e3d6000fd5b505050506000821115610be75760405173ffffffffffffffffffffffffffffffffffffffff84169083156108fc029084906000818181858888f19350505050158015610be5573d6000803e3d6000fd5b505b6000610bf9828463ffffffff61120616565b90508015610c3057604051339082156108fc029083906000818181858888f19350505050158015610c2e573d6000803e3d6000fd5b505b505b509392505050565b600082820183811015610c5657610c56610090600086866113c0565b9392505050565b6000610c7f83610c73868563ffffffff6113df16565b9063ffffffff61141016565b949350505050565b82516000908190815b818114610d9157610ca78760008151811061093357fe5b610cbe57610cbe6100908860008151811061097e57fe5b868181518110610cca57fe5b60200260200101516080015160001480610cfb5750868181518110610ceb57fe5b602002602001015160a001516000145b15610d0557610d89565b6000610d17878663ffffffff61120616565b9050600080610d4d8a8581518110610d2b57fe5b6020026020010151898681518110610d3f57fe5b60200260200101518561143a565b9092509050610d62878363ffffffff610c3a16565b9650610d74868263ffffffff610c3a16565b9550888710610d8557505050610d91565b5050505b600101610c90565b5050935093915050565b60408051808201909152600481527fe69edc3e00000000000000000000000000000000000000000000000000000000602082015290565b6060632800659560e01b848484604051602401610df193929190611e16565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915290509392505050565b6060631de45ad160e01b8383604051602401610e94929190611d2e565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090931692909217909152905092915050565b6000610f2c83601063ffffffff61070a16565b9050600060608273ffffffffffffffffffffffffffffffffffffffff16604051610f5590611c95565b60405180910390203386604051602401610f70929190611d08565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529181526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909416939093179092529051610ff99190611c50565b6000604051808303816000865af19150503d8060008114611036576040519150601f19603f3d011682016040523d82523d6000602084013e61103b565b606091505b50915091508161105157611051610090826114e9565b3d15611070576000915060203d14156110705760206000803e60005191505b8161090c5761090c610090826114e9565b806001146110955761109561009082611504565b60006110a883601063ffffffff61070a16565b905060006110bd84602463ffffffff61151f16565b6040517f23b872dd00000000000000000000000000000000000000000000000000000000815290915073ffffffffffffffffffffffffffffffffffffffff8316906323b872dd9061111690309033908690600401611d55565b600060405180830381600087803b15801561113057600080fd5b505af1158015611144573d6000803e3d6000fd5b5050505050505050565b6060637996a27160e01b826040516024016101729190611d86565b6040805160048152602481019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f1213e1d60000000000000000000000000000000000000000000000000000000017905290565b600081518351148015610c56575081805190602001208380519060200120149392505050565b60606356677f2c60e01b8383604051602401610e94929190611dc6565b60008282111561121f5761121f610090600285856113c0565b50900390565b6000808460e001516000148061125157506101608501516101a08601516112519163ffffffff6111c316565b156112ab57600061126b8660a0015187608001518661152b565b90506112756116bf565b611280878388611561565b905061129d81606001518260200151610c3a90919063ffffffff16565b905190935091506113469050565b6101408501516101a08601516112c69163ffffffff6111c316565b156113355760006112f68660a001516112f08860e00151896080015161120690919063ffffffff16565b8661152b565b90506113006116bf565b61130b878388611561565b60208101516060820151825191965091925061132c9163ffffffff61120616565b92505050611346565b611346610090866101a0015161167a565b935093915050565b60606391353a0c60e01b8383604051602401610e94929190611f8d565b6060631174fb8060e01b826040516024016101729190611f84565b6060635cc555c860e01b8383604051602401610e94929190611f8d565b606063ecf40fd960e01b8383604051602401610e94929190611f8d565b606063e946c1bb60e01b848484604051602401610df193929190611df4565b6000826113ee575060006106aa565b828202828482816113fb57fe5b0414610c5657610c56610090600186866113c0565b60008161142657611426610090600385856113c0565b600082848161143157fe5b04949350505050565b6000808460e001516000148061146657506101408501516101a08601516114669163ffffffff6111c316565b156114a7576114736116bf565b61147e868587611561565b60208101516060820151825191955091925061149f9163ffffffff61120616565b915050611346565b6101608501516101a08601516114c29163ffffffff6111c316565b156113355760a085015160e086015160009161126b916112f090829063ffffffff610c3a16565b6060635e7eb60f60e01b826040516024016101729190611db3565b606063baffa47460e01b826040516024016101729190611f84565b6000610c568383611695565b6000610c7f83610c7361154582600163ffffffff61120616565b611555888763ffffffff6113df16565b9063ffffffff610c3a16565b6115696116bf565b6040516060907f9b44d55600000000000000000000000000000000000000000000000000000000906115a390879087908790602401611e24565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909316929092178252600154815191935073ffffffffffffffffffffffffffffffffffffffff169160809184916000855af18015610c2e57825184526020830151602085015260408301516040850152606083015160608501525050509392505050565b60606331360af160e01b826040516024016101729190611db3565b600081602001835110156116b6576116b66100906005855185602001610dd2565b50016020015190565b6040518060a0016040528060008152602001600081526020016000815260200160008152602001600081525090565b80356106aa81612029565b600082601f830112611709578081fd5b813561171c61171782611fd8565b611fb1565b8181529150602080830190840160005b83811015611759576117448760208435890101611975565b8352602092830192919091019060010161172c565b5050505092915050565b600082601f830112611773578081fd5b813561178161171782611fd8565b81815291506020808301908481016000805b8582101561192057823588016101c0807fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0838d030112156117d2578283fd5b6117db81611fb1565b6117e78c8885016116ee565b81526117f68c604085016116ee565b878201526118078c606085016116ee565b60408201526118198c608085016116ee565b606082015260a0830135608082015260c083013560a082015260e083013560c08201526101008084013560e08301526101208085013582840152610140915081850135818401525061016084013567ffffffffffffffff8082111561187c578687fd5b61188a8f8b84890101611975565b838501526101809250828601359150808211156118a5578687fd5b6118b38f8b84890101611975565b6101608501526101a08601359150808211156118cd578687fd5b6118db8f8b84890101611975565b83850152848601359250808311156118f1578687fd5b50506119018d8983870101611975565b6101a08301525087525050938301939183019160019190910190611793565b50505050505092915050565b60008083601f84011261193e57600080fd5b50813567ffffffffffffffff81111561195657600080fd5b60208301915083602082850101111561196e57600080fd5b9250929050565b600082601f830112611985578081fd5b813567ffffffffffffffff81111561199b578182fd5b6119cc60207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f84011601611fb1565b91508082528360208285010111156119e357600080fd5b8060208401602084013760009082016020015292915050565b600060208284031215611a0e57600080fd5b8135610c5681612029565b600060208284031215611a2b57600080fd5b8151610c5681612029565b60008060008060808587031215611a4b578283fd5b843567ffffffffffffffff80821115611a62578485fd5b611a6e88838901611763565b95506020870135915080821115611a83578485fd5b50611a90878288016116f9565b935050604085013591506060850135611aa881612029565b939692955090935050565b600080600080600060a08688031215611aca578081fd5b853567ffffffffffffffff80821115611ae1578283fd5b611aed89838a01611763565b9650602088013595506040880135915080821115611b09578283fd5b50611b16888289016116f9565b935050606086013591506080860135611b2e81612029565b809150509295509295909350565b600060208284031215611b4e57600080fd5b81518015158114610c5657600080fd5b60008060208385031215611b7157600080fd5b823567ffffffffffffffff811115611b8857600080fd5b611b948582860161192c565b90969095509350505050565b600080600060408486031215611bb557600080fd5b833567ffffffffffffffff811115611bcc57600080fd5b611bd88682870161192c565b909790965060209590950135949350505050565b73ffffffffffffffffffffffffffffffffffffffff169052565b60008151808452611c1e816020860160208601611ff9565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b60008251611c62818460208701611ff9565b9190910192915050565b7f455243373231546f6b656e28616464726573732c75696e7432353629000000008152601c0190565b7f7472616e7366657228616464726573732c75696e743235362900000000000000815260190190565b7f4552433230546f6b656e28616464726573732900000000000000000000000000815260130190565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b73ffffffffffffffffffffffffffffffffffffffff929092168252602082015260400190565b73ffffffffffffffffffffffffffffffffffffffff92831681529116602082015260400190565b73ffffffffffffffffffffffffffffffffffffffff9384168152919092166020820152604081019190915260600190565b7fffffffff0000000000000000000000000000000000000000000000000000000091909116815260200190565b600060208252610c566020830184611c06565b600060408252611dd96040830185611c06565b8281036020840152611deb8185611c06565b95945050505050565b6060810160048510611e0257fe5b938152602081019290925260409091015290565b6060810160088510611e0257fe5b6000606082526101c0611e3b606084018751611bec565b6020860151611e4d6080850182611bec565b506040860151611e6060a0850182611bec565b506060860151611e7360c0850182611bec565b50608086015160e084015260a0860151610100818186015260c08801519150610120828187015260e089015192506101408381880152828a0151935061016092508383880152818a0151935061018091508382880152808a01519350506101a08481880152611ee6610220880185611c06565b838b015194507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa09350838882030186890152611f228186611c06565b955050818a0151935082878603016101e0880152611f408585611c06565b908a0151878203840161020089015294509050611f5d8185611c06565b925050508560208501528381036040850152611f798186611c06565b979650505050505050565b90815260200190565b918252602082015260400190565b9283526020830191909152604082015260600190565b60405181810167ffffffffffffffff81118282101715611fd057600080fd5b604052919050565b600067ffffffffffffffff821115611fef57600080fd5b5060209081020190565b60005b83811015612014578181015183820152602001611ffc565b83811115612023576000848401525b50505050565b73ffffffffffffffffffffffffffffffffffffffff8116811461065757600080fdfea365627a7a72315820db2f1b7ebe1fc58ec155124eeb6a8f31116337029f3ae90db6b035c8684879256c6578706572696d656e74616cf564736f6c634300050b0040';
    /**
     * Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf.
     * This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the
     * Forwarder contract to the fee recipient.
     * This method needs to be called before forwarding orders of a maker asset that hasn't
     * previously been approved.
     */
    public approveMakerAssetProxy = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(assetData: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetData: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.approveMakerAssetProxy.sendTransactionAsync(assetData, txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(assetData: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async validateAndSendTransactionAsync(
            assetData: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).approveMakerAssetProxy.callAsync(assetData, txData);
            const txHash = await (this as any).approveMakerAssetProxy.sendTransactionAsync(assetData, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData Byte array encoded for the respective asset proxy.
         */
        async callAsync(assetData: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('assetData', assetData);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('approveMakerAssetProxy(bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData Byte array encoded for the respective asset proxy.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string): string {
            assert.isString('assetData', assetData);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('approveMakerAssetProxy(bytes)', [assetData]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('approveMakerAssetProxy(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('approveMakerAssetProxy(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Withdraws assets from this contract. The contract formerly required a ZRX balance in order
     * to function optimally, and this function allows the ZRX to be withdrawn by owner.
     * It may also be used to withdraw assets that were accidentally sent to this contract.
     */
    public withdrawAsset = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData, amount]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.withdrawAsset.sendTransactionAsync(assetData, amount, txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData, amount]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async validateAndSendTransactionAsync(
            assetData: string,
            amount: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).withdrawAsset.callAsync(assetData, amount, txData);
            const txHash = await (this as any).withdrawAsset.sendTransactionAsync(assetData, amount, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         */
        async callAsync(
            assetData: string,
            amount: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [assetData, amount]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('withdrawAsset(bytes,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param assetData Byte array encoded for the respective asset proxy.
         * @param amount Amount of ERC20 token to withdraw.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(assetData: string, amount: BigNumber): string {
            assert.isString('assetData', assetData);
            assert.isBigNumber('amount', amount);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('withdrawAsset(bytes,uint256)', [
                assetData,
                amount,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, BigNumber] {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('withdrawAsset(bytes,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, BigNumber]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('withdrawAsset(bytes,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public owner = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('owner()', []);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(): string {
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('owner()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('owner()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction.
     * The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can
     * pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees).
     * Any ETH not spent will be refunded to sender.
     */
    public marketBuyOrdersWithEth = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.marketBuyOrdersWithEth.sendTransactionAsync(
                orders,
                makerAssetBuyAmount,
                signatures,
                feePercentage,
                feeRecipient.toLowerCase(),
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async validateAndSendTransactionAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).marketBuyOrdersWithEth.callAsync(
                orders,
                makerAssetBuyAmount,
                signatures,
                feePercentage,
                feeRecipient,
                txData,
            );
            const txHash = await (this as any).marketBuyOrdersWithEth.sendTransactionAsync(
                orders,
                makerAssetBuyAmount,
                signatures,
                feePercentage,
                feeRecipient,
                txData,
            );
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.ethFeePaid Amount of ETH spent on the given forwarder fee.
         */
        async callAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber, BigNumber]> {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            makerAssetBuyAmount: BigNumber,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);
            assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
                [orders, makerAssetBuyAmount, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(
            callData: string,
        ): [
            Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            BigNumber,
            string[],
            BigNumber,
            string
        ] {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [
                    Array<{
                        makerAddress: string;
                        takerAddress: string;
                        feeRecipientAddress: string;
                        senderAddress: string;
                        makerAssetAmount: BigNumber;
                        takerAssetAmount: BigNumber;
                        makerFee: BigNumber;
                        takerFee: BigNumber;
                        expirationTimeSeconds: BigNumber;
                        salt: BigNumber;
                        makerAssetData: string;
                        takerAssetData: string;
                        makerFeeAssetData: string;
                        takerFeeAssetData: string;
                    }>,
                    BigNumber,
                    string[],
                    BigNumber,
                    string
                ]
            >(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [BigNumber, BigNumber, BigNumber] {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketBuyOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber]>(
                returnData,
            );
            return abiDecodedReturnData;
        },
    };
    /**
     * Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent
     * as possible, accounting for order and forwarder fees.
     */
    public marketSellOrdersWithEth = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.marketSellOrdersWithEth.sendTransactionAsync(
                orders,
                signatures,
                feePercentage,
                feeRecipient.toLowerCase(),
                txData,
            );
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async validateAndSendTransactionAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).marketSellOrdersWithEth.callAsync(
                orders,
                signatures,
                feePercentage,
                feeRecipient,
                txData,
            );
            const txHash = await (this as any).marketSellOrdersWithEth.sendTransactionAsync(
                orders,
                signatures,
                feePercentage,
                feeRecipient,
                txData,
            );
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns wethSpentAmount Amount of WETH spent on the given set of orders.makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.ethFeePaid Amount of ETH spent on the given forwarder fee.
         */
        async callAsync(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[BigNumber, BigNumber, BigNumber]> {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param orders Array of order specifications used containing desired
         *     makerAsset and WETH as takerAsset.
         * @param signatures Proofs that orders have been created by makers.
         * @param feePercentage Percentage of WETH sold that will payed as fee to
         *     forwarding contract feeRecipient.
         * @param feeRecipient Address that will receive ETH when orders are filled.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            orders: Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            signatures: string[],
            feePercentage: BigNumber,
            feeRecipient: string,
        ): string {
            assert.isArray('orders', orders);
            assert.isArray('signatures', signatures);
            assert.isBigNumber('feePercentage', feePercentage);
            assert.isString('feeRecipient', feeRecipient);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
                [orders, signatures, feePercentage, feeRecipient.toLowerCase()],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(
            callData: string,
        ): [
            Array<{
                makerAddress: string;
                takerAddress: string;
                feeRecipientAddress: string;
                senderAddress: string;
                makerAssetAmount: BigNumber;
                takerAssetAmount: BigNumber;
                makerFee: BigNumber;
                takerFee: BigNumber;
                expirationTimeSeconds: BigNumber;
                salt: BigNumber;
                makerAssetData: string;
                takerAssetData: string;
                makerFeeAssetData: string;
                takerFeeAssetData: string;
            }>,
            string[],
            BigNumber,
            string
        ] {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [
                    Array<{
                        makerAddress: string;
                        takerAddress: string;
                        feeRecipientAddress: string;
                        senderAddress: string;
                        makerAssetAmount: BigNumber;
                        takerAssetAmount: BigNumber;
                        makerFee: BigNumber;
                        takerFee: BigNumber;
                        expirationTimeSeconds: BigNumber;
                        salt: BigNumber;
                        makerAssetData: string;
                        takerAssetData: string;
                        makerFeeAssetData: string;
                        takerFeeAssetData: string;
                    }>,
                    string[],
                    BigNumber,
                    string
                ]
            >(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [BigNumber, BigNumber, BigNumber] {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder(
                'marketSellOrdersWithEth((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256,address)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[BigNumber, BigNumber, BigNumber]>(
                returnData,
            );
            return abiDecodedReturnData;
        },
    };
    public transferOwnership = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const txHash = await self._web3Wrapper.sendTransactionAsync(txDataWithDefaults);
            return txHash;
        },
        /**
         * Sends an Ethereum transaction and waits until the transaction has been successfully mined without reverting.
         * If the transaction was mined, but reverted, an error is thrown.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
            const txHashPromise = self.transferOwnership.sendTransactionAsync(newOwner.toLowerCase(), txData);
            return new PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs>(
                txHashPromise,
                (async (): Promise<TransactionReceiptWithDecodedLogs> => {
                    // When the transaction hash resolves, wait for it to be mined.
                    return self._web3Wrapper.awaitTransactionSuccessAsync(
                        await txHashPromise,
                        pollingIntervalMs,
                        timeoutMs,
                    );
                })(),
            );
        },
        /**
         * Estimates the gas cost of sending an Ethereum transaction calling this method with these arguments.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
            const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...txData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            if (txDataWithDefaults.from !== undefined) {
                txDataWithDefaults.from = txDataWithDefaults.from.toLowerCase();
            }

            const gas = await self._web3Wrapper.estimateGasAsync(txDataWithDefaults);
            return gas;
        },
        async validateAndSendTransactionAsync(newOwner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).transferOwnership.callAsync(newOwner, txData);
            const txHash = await (this as any).transferOwnership.sendTransactionAsync(newOwner, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(newOwner: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('newOwner', newOwner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ForwarderContract;
            const encodedData = self._strictEncodeArguments('transferOwnership(address)', [newOwner.toLowerCase()]);
            const callDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
                {
                    to: self.address,
                    ...callData,
                    data: encodedData,
                },
                self._web3Wrapper.getContractDefaults(),
            );
            callDataWithDefaults.from = callDataWithDefaults.from
                ? callDataWithDefaults.from.toLowerCase()
                : callDataWithDefaults.from;
            let rawCallResult;
            try {
                rawCallResult = await self._web3Wrapper.callAsync(callDataWithDefaults, defaultBlock);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(newOwner: string): string {
            assert.isString('newOwner', newOwner);
            const self = (this as any) as ForwarderContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('transferOwnership(address)', [
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ForwarderContract;
            const abiEncoder = self._lookupAbiEncoder('transferOwnership(address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _exchange: string,
        _wethAssetData: string,
    ): Promise<ForwarderContract> {
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        if (artifact.compilerOutput === undefined) {
            throw new Error('Compiler output not found in the artifact file');
        }
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const bytecode = artifact.compilerOutput.evm.bytecode.object;
        const abi = artifact.compilerOutput.abi;
        const logDecodeDependenciesAbiOnly: { [contractName: string]: ContractAbi } = {};
        if (Object.keys(logDecodeDependencies) !== undefined) {
            for (const key of Object.keys(logDecodeDependencies)) {
                logDecodeDependenciesAbiOnly[key] = logDecodeDependencies[key].compilerOutput.abi;
            }
        }
        return ForwarderContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _exchange,
            _wethAssetData,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _exchange: string,
        _wethAssetData: string,
    ): Promise<ForwarderContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [_exchange, _wethAssetData] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [_exchange, _wethAssetData],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [_exchange, _wethAssetData]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`Forwarder successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ForwarderContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [_exchange, _wethAssetData];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                constant: false,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                ],
                name: 'approveMakerAssetProxy',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'assetData',
                        type: 'bytes',
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'withdrawAsset',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'owner',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'makerAssetBuyAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'feePercentage',
                        type: 'uint256',
                    },
                    {
                        name: 'feeRecipient',
                        type: 'address',
                    },
                ],
                name: 'marketBuyOrdersWithEth',
                outputs: [
                    {
                        name: 'wethSpentAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'makerAssetAcquiredAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'ethFeePaid',
                        type: 'uint256',
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'orders',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'makerAddress',
                                type: 'address',
                            },
                            {
                                name: 'takerAddress',
                                type: 'address',
                            },
                            {
                                name: 'feeRecipientAddress',
                                type: 'address',
                            },
                            {
                                name: 'senderAddress',
                                type: 'address',
                            },
                            {
                                name: 'makerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'takerAssetAmount',
                                type: 'uint256',
                            },
                            {
                                name: 'makerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'takerFee',
                                type: 'uint256',
                            },
                            {
                                name: 'expirationTimeSeconds',
                                type: 'uint256',
                            },
                            {
                                name: 'salt',
                                type: 'uint256',
                            },
                            {
                                name: 'makerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'makerFeeAssetData',
                                type: 'bytes',
                            },
                            {
                                name: 'takerFeeAssetData',
                                type: 'bytes',
                            },
                        ],
                    },
                    {
                        name: 'signatures',
                        type: 'bytes[]',
                    },
                    {
                        name: 'feePercentage',
                        type: 'uint256',
                    },
                    {
                        name: 'feeRecipient',
                        type: 'address',
                    },
                ],
                name: 'marketSellOrdersWithEth',
                outputs: [
                    {
                        name: 'wethSpentAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'makerAssetAcquiredAmount',
                        type: 'uint256',
                    },
                    {
                        name: 'ethFeePaid',
                        type: 'uint256',
                    },
                ],
                payable: true,
                stateMutability: 'payable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'newOwner',
                        type: 'address',
                    },
                ],
                name: 'transferOwnership',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: '_exchange',
                        type: 'address',
                    },
                    {
                        name: '_wethAssetData',
                        type: 'bytes',
                    },
                ],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
            {
                inputs: [],
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'fallback',
            },
        ] as ContractAbi;
        return abi;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = ForwarderContract.deployedBytecode,
    ) {
        super(
            'Forwarder',
            ForwarderContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
