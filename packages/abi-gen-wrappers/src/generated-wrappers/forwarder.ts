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
import { SimpleContractArtifact, EventCallback, IndexedFilterValues } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { assert } from '@0x/assert';
import * as ethers from 'ethers';
// tslint:enable:no-unused-variable

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ForwarderContract extends BaseContract {
    public static deployedBytecode =
        '0x6080604052600436106100655760003560e01c8063942d33c011610043578063942d33c014610102578063ae93b97a14610124578063f2fde38b1461013757610065565b8063442026ed14610097578063630f1e6c146100b75780638da5cb5b146100d7575b60025473ffffffffffffffffffffffffffffffffffffffff1633146100955761009561009033610157565b6101f6565b005b3480156100a357600080fd5b506100956100b2366004611bc6565b6101fe565b3480156100c357600080fd5b506100956100d2366004611c06565b6104a8565b3480156100e357600080fd5b506100ec6104f1565b6040516100f99190611dc0565b60405180910390f35b610115610110366004611b1d565b61050d565b6040516100f993929190612047565b610115610132366004611aa0565b610542565b34801561014357600080fd5b50610095610152366004611a68565b61059d565b60606308b1869860e01b826040516024016101729190611dc0565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909316929092179091529050919050565b805160208201fd5b600061024a600084848080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929392505063ffffffff610614169050565b905060405161025890611d97565b60405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614156104a35760015460405160009173ffffffffffffffffffffffffffffffffffffffff16906360704108906102d490611d97565b6040519081900381207fffffffff0000000000000000000000000000000000000000000000000000000060e084901b16825261031291600401611e5f565b60206040518083038186803b15801561032a57600080fd5b505afa15801561033e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052506103629190810190611a84565b905073ffffffffffffffffffffffffffffffffffffffff811661038a5761038a61009061066a565b60006103d6601086868080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929392505063ffffffff6106c4169050565b6040517f095ea7b300000000000000000000000000000000000000000000000000000000815290915073ffffffffffffffffffffffffffffffffffffffff82169063095ea7b39061044d9085907fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff90600401611de1565b602060405180830381600087803b15801561046757600080fd5b505af115801561047b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525061049f9190810190611ba6565b5050505b505050565b6104b0610704565b6104a383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525085925061074d915050565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b600080600061051a610838565b6105258888886108cd565b90935091506105358386866109f0565b9050955095509592505050565b600080600061054f610838565b6000610573670de0b6b3a764000061056d888263ffffffff610b8f16565b34610bb2565b9050610580888289610bdc565b90945092506105908487876109f0565b9150509450945094915050565b6105a5610704565b73ffffffffffffffffffffffffffffffffffffffff81166105d0576105cb610090610d9f565b610611565b600080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff83161790555b50565b60008160040183511015610635576106356100906003855185600401610dd6565b5060208183018101519101907fffffffff00000000000000000000000000000000000000000000000000000000165b92915050565b6040805160048152602481019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167ff3b96b8d0000000000000000000000000000000000000000000000000000000017905290565b600081601401835110156106e5576106e56100906004855185601401610dd6565b50016014015173ffffffffffffffffffffffffffffffffffffffff1690565b60005473ffffffffffffffffffffffffffffffffffffffff16331461074b5760005461074b9061009090339073ffffffffffffffffffffffffffffffffffffffff16610e7b565b565b600061075f838263ffffffff61061416565b905060405161076d90611d97565b60405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614156107c9576107c48383610f1d565b6104a3565b6040516107d590611d45565b60405180910390207bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916141561082c576107c48383611085565b6104a361009082611152565b346108485761084861009061116d565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663d0e30db0346040518263ffffffff1660e01b81526004016000604051808303818588803b1580156108b257600080fd5b505af11580156108c6573d6000803e3d6000fd5b5050505050565b82516000908190815b8181146109d1578681815181106108e957fe5b6020026020010151608001516000148061091a575086818151811061090a57fe5b602002602001015160a001516000145b15610924576109c9565b6000610936878563ffffffff6111c716565b905060008061096c8a858151811061094a57fe5b602002602001015189868151811061095e57fe5b6020026020010151856111e6565b915091506109928a858151811061097f57fe5b602002602001015161014001518261074d565b6109a2878363ffffffff610b8f16565b96506109b4868263ffffffff610b8f16565b95508886106109c5575050506109d1565b5050505b6001016108d6565b50848210156109e7576109e76100908684611339565b50935093915050565b600066b1a2bc2ec50000831115610a0d57610a0d61009084611356565b34841115610a2257610a226100908534611371565b6000610a34348663ffffffff6111c716565b9050610a4984670de0b6b3a764000087610bb2565b915080821115610a6057610a60610090838361138e565b8015610b87576002546040517f2e1a7d4d00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff90911690632e1a7d4d90610abc908490600401612030565b600060405180830381600087803b158015610ad657600080fd5b505af1158015610aea573d6000803e3d6000fd5b505050506000821115610b3c5760405173ffffffffffffffffffffffffffffffffffffffff84169083156108fc029084906000818181858888f19350505050158015610b3a573d6000803e3d6000fd5b505b6000610b4e828463ffffffff6111c716565b90508015610b8557604051339082156108fc029083906000818181858888f19350505050158015610b83573d6000803e3d6000fd5b505b505b509392505050565b600082820183811015610bab57610bab610090600086866113ab565b9392505050565b6000610bd483610bc8868563ffffffff6113ca16565b9063ffffffff6113fb16565b949350505050565b6000806000855190506000610c97600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16631ce4c78b6040518163ffffffff1660e01b815260040160206040518083038186803b158015610c5257600080fd5b505afa158015610c66573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250610c8a9190810190611cad565b3a9063ffffffff6113ca16565b905060005b828114610d9457878181518110610caf57fe5b60200260200101516080015160001480610ce05750878181518110610cd057fe5b602002602001015160a001516000145b15610cea57610d8c565b6000610d0c83610d008a8963ffffffff6111c716565b9063ffffffff6111c716565b9050600080610d428b8581518110610d2057fe5b60200260200101518a8681518110610d3457fe5b602002602001015185611425565b91509150610d558b858151811061097f57fe5b610d65888363ffffffff610b8f16565b9750610d77878263ffffffff610b8f16565b9650898810610d8857505050610d94565b5050505b600101610c9c565b505050935093915050565b60408051808201909152600481527fe69edc3e00000000000000000000000000000000000000000000000000000000602082015290565b6060632800659560e01b848484604051602401610df593929190611ec1565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915290509392505050565b6060631de45ad160e01b8383604051602401610e98929190611e07565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090931692909217909152905092915050565b6000610f3083601063ffffffff6106c416565b9050600060608273ffffffffffffffffffffffffffffffffffffffff16604051610f5990611d6e565b60405180910390203386604051602401610f74929190611de1565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529181526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909416939093179092529051610ffd9190611d29565b6000604051808303816000865af19150503d806000811461103a576040519150601f19603f3d011682016040523d82523d6000602084013e61103f565b606091505b50915091508161105557611055610090826114ea565b3d15611074576000915060203d14156110745760206000803e60005191505b816108c6576108c6610090826114ea565b806001146110995761109961009082611505565b60006110ac83601063ffffffff6106c416565b905060006110c184602463ffffffff61152016565b6040517f23b872dd00000000000000000000000000000000000000000000000000000000815290915073ffffffffffffffffffffffffffffffffffffffff8316906323b872dd9061111a90309033908690600401611e2e565b600060405180830381600087803b15801561113457600080fd5b505af1158015611148573d6000803e3d6000fd5b5050505050505050565b6060637996a27160e01b826040516024016101729190611e5f565b6040805160048152602481019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f8c0e562b0000000000000000000000000000000000000000000000000000000017905290565b6000828211156111e0576111e0610090600285856113ab565b50900390565b6000808460e001516000148061121257506101608501516101a08601516112129163ffffffff61152c16565b1561128057600061122c8660a00151876080015186611552565b905061123661172e565b61124187838861157c565b9050611272816080015161126683606001518460200151610b8f90919063ffffffff16565b9063ffffffff610b8f16565b905190935091506113319050565b6101408501516101a086015161129b9163ffffffff61152c16565b156113205760006112cb8660a001516112c58860e0015189608001516111c790919063ffffffff16565b86611552565b90506112d561172e565b6112e087838861157c565b90506112fd81608001518260200151610b8f90919063ffffffff16565b60608201518251919550611317919063ffffffff6111c716565b92505050611331565b611331610090866101a001516116e9565b935093915050565b60606391353a0c60e01b8383604051602401610e98929190612039565b6060631174fb8060e01b826040516024016101729190612030565b606063cdcbed5d60e01b8383604051602401610e98929190612039565b606063ecf40fd960e01b8383604051602401610e98929190612039565b606063e946c1bb60e01b848484604051602401610df593929190611e9f565b6000826113d957506000610664565b828202828482816113e657fe5b0414610bab57610bab610090600186866113ab565b60008161141157611411610090600385856113ab565b600082848161141c57fe5b04949350505050565b6000808460e001516000148061145157506101408501516101a08601516114519163ffffffff61152c16565b156114a85761145e61172e565b61146986858761157c565b905061148681608001518260200151610b8f90919063ffffffff16565b606082015182519194506114a0919063ffffffff6111c716565b915050611331565b6101608501516101a08601516114c39163ffffffff61152c16565b156113205760a085015160e086015160009161122c916112c590829063ffffffff610b8f16565b6060635e7eb60f60e01b826040516024016101729190611e8c565b606063baffa47460e01b826040516024016101729190612030565b6000610bab8383611704565b600081518351148015610bab575081805190602001208380519060200120149392505050565b6000610bd483610bc861156c82600163ffffffff6111c716565b611266888763ffffffff6113ca16565b61158461172e565b6040516060907f9b44d55600000000000000000000000000000000000000000000000000000000906115be90879087908790602401611ecf565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529181526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090941693909317909252600154915190925073ffffffffffffffffffffffffffffffffffffffff90911690600090606090839061166f908690611d29565b6000604051808303816000865af19150503d80600081146116ac576040519150601f19603f3d011682016040523d82523d6000602084013e6116b1565b606091505b509150915081156116de57805160a0146116c757fe5b808060200190516116db9190810190611c50565b94505b505050509392505050565b60606331360af160e01b826040516024016101729190611e8c565b60008160200183511015611725576117256100906005855185602001610dd6565b50016020015190565b6040518060a0016040528060008152602001600081526020016000815260200160008152602001600081525090565b8035610664816120d4565b600082601f830112611778578081fd5b813561178b61178682612084565b61205d565b8181529150602080830190840160005b838110156117c8576117b387602084358901016119e1565b8352602092830192919091019060010161179b565b5050505092915050565b600082601f8301126117e2578081fd5b81356117f061178682612084565b818152915060208083019084810160005b8481101561198f57813587016101c0807fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0838c0301121561184157600080fd5b61184a8161205d565b6118568b87850161175d565b81526118658b6040850161175d565b868201526118768b6060850161175d565b60408201526118888b6080850161175d565b606082015260a0830135608082015260c083013560a082015260e083013560c08201526101008084013560e0830152610120808501358284015261014091508185013581840152506101608085013567ffffffffffffffff808211156118ed57600080fd5b6118fb8f8b848a01016119e1565b8486015261018093508387013591508082111561191757600080fd5b6119258f8b848a01016119e1565b838601526101a092508287013591508082111561194157600080fd5b61194f8f8b848a01016119e1565b848601528587013593508084111561196657600080fd5b50506119768d89848801016119e1565b9083015250865250509282019290820190600101611801565b505050505092915050565b60008083601f8401126119ab578182fd5b50813567ffffffffffffffff8111156119c2578182fd5b6020830191508360208285010111156119da57600080fd5b9250929050565b600082601f8301126119f1578081fd5b813567ffffffffffffffff811115611a07578182fd5b611a3860207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8401160161205d565b9150808252836020828501011115611a4f57600080fd5b8060208401602084013760009082016020015292915050565b600060208284031215611a79578081fd5b8135610bab816120d4565b600060208284031215611a95578081fd5b8151610bab816120d4565b60008060008060808587031215611ab5578283fd5b843567ffffffffffffffff80821115611acc578485fd5b611ad8888389016117d2565b95506020870135915080821115611aed578485fd5b50611afa87828801611768565b935050604085013591506060850135611b12816120d4565b939692955090935050565b600080600080600060a08688031215611b34578081fd5b853567ffffffffffffffff80821115611b4b578283fd5b611b5789838a016117d2565b9650602088013595506040880135915080821115611b73578283fd5b50611b8088828901611768565b935050606086013591506080860135611b98816120d4565b809150509295509295909350565b600060208284031215611bb7578081fd5b81518015158114610bab578182fd5b60008060208385031215611bd8578182fd5b823567ffffffffffffffff811115611bee578283fd5b611bfa8582860161199a565b90969095509350505050565b600080600060408486031215611c1a578283fd5b833567ffffffffffffffff811115611c30578384fd5b611c3c8682870161199a565b909790965060209590950135949350505050565b600060a0828403128015611c62578182fd5b8015611c6c578182fd5b50611c7760a061205d565b82518152602083015160208201526040830151604082015260608301516060820152608083015160808201528091505092915050565b600060208284031215611cbe578081fd5b5051919050565b73ffffffffffffffffffffffffffffffffffffffff169052565b60008151808452611cf78160208601602086016120a4565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b60008251611d3b8184602087016120a4565b9190910192915050565b7f455243373231546f6b656e28616464726573732c75696e7432353629000000008152601c0190565b7f7472616e7366657228616464726573732c75696e743235362900000000000000815260190190565b7f4552433230546f6b656e28616464726573732900000000000000000000000000815260130190565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b73ffffffffffffffffffffffffffffffffffffffff929092168252602082015260400190565b73ffffffffffffffffffffffffffffffffffffffff92831681529116602082015260400190565b73ffffffffffffffffffffffffffffffffffffffff9384168152919092166020820152604081019190915260600190565b7fffffffff0000000000000000000000000000000000000000000000000000000091909116815260200190565b600060208252610bab6020830184611cdf565b6060810160048510611ead57fe5b938152602081019290925260409091015290565b6060810160088510611ead57fe5b600060608252611ee3606083018651611cc5565b6020850151611ef56080840182611cc5565b506040850151611f0860a0840182611cc5565b506060850151611f1b60c0840182611cc5565b50608085015160e083015260a0850151610100818185015260c08701519150610120828186015260e0880151925061014083818701528289015193506101609250838387015281890151935061018091508382870152808901519350506101c06101a08181880152611f91610220880186611cdf565b848b015195507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa09450848882030183890152611fcd8187611cdf565b925050828a0151945083878303016101e0880152611feb8286611cdf565b9250808a015194505050818582030161020086015261200a8184611cdf565b91505085602085015283810360408501526120258186611cdf565b979650505050505050565b90815260200190565b918252602082015260400190565b9283526020830191909152604082015260600190565b60405181810167ffffffffffffffff8111828210171561207c57600080fd5b604052919050565b600067ffffffffffffffff82111561209a578081fd5b5060209081020190565b60005b838110156120bf5781810151838201526020016120a7565b838111156120ce576000848401525b50505050565b73ffffffffffffffffffffffffffffffffffffffff8116811461061157600080fdfea365627a7a72315820afeb88c9cc19090963cb885eb76d709ca1a151f8f73996031898e2b50578a89b6c6578706572696d656e74616cf564736f6c634300050c0040';
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
