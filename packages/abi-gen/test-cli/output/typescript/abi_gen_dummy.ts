// tslint:disable:no-consecutive-blank-lines ordered-imports align trailing-comma
// tslint:disable:whitespace no-unbound-method no-trailing-whitespace
// tslint:disable:no-unused-variable
import { BaseContract, SubscriptionManager, PromiseWithTransactionHash } from '@0x/base-contract';
import { schemas } from '@0x/json-schemas';
import {
    BlockParam,
    BlockParamLiteral,
    BlockRange,
    CallData,
    ContractAbi,
    ContractArtifact,
    DecodedLogArgs,
    LogWithDecodedArgs,
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

export type AbiGenDummyEventArgs = AbiGenDummySimpleEventEventArgs | AbiGenDummyWithdrawalEventArgs;

export enum AbiGenDummyEvents {
    SimpleEvent = 'SimpleEvent',
    Withdrawal = 'Withdrawal',
}

export interface AbiGenDummySimpleEventEventArgs extends DecodedLogArgs {
    someBytes: string;
    someString: string;
}

export interface AbiGenDummyWithdrawalEventArgs extends DecodedLogArgs {
    _owner: string;
    _value: BigNumber;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class AbiGenDummyContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b50600436106101ef5760003560e01c8063647341eb1161010f578063bb607362116100a2578063d88be12f11610071578063d88be12f146103d7578063ee8b86fb146103df578063f408fb311461028f578063fa315f9d146103f2576101ef565b8063bb6073621461038f578063bdab1688146103a5578063cd3c0b97146103ba578063d6d7618c146103c2576101ef565b80638ee52b4e116100de5780638ee52b4e1461035e5780639a3b618514610371578063a3c2f6b614610379578063ae2dae1714610381576101ef565b8063647341eb1461032057806376f15d5b1461032e5780637833bec0146103365780637a791e6e14610356576101ef565b80634582eab211610187578063586f84b211610156578063586f84b2146102db57806359c28add146102f05780635ba3c7c01461030557806363d69c881461030d576101ef565b80634582eab2146102a557806345fdbdb7146102ad5780634bb9a37b146102b557806351bd9ce7146102c8576101ef565b80633687617d116101c35780633687617d1461024d57806336b323961461026f5780633e9ef66a1461028f5780634303a5421461029d576101ef565b806209e437146101f45780630527c28f146101fe5780631310e444146102115780632e1a7d4d1461023a575b600080fd5b6101fc610400565b005b6101fc61020c366004610ce2565b61043d565b61022461021f366004610dea565b610440565b6040516102319190611419565b60405180910390f35b6101fc610248366004610dea565b610447565b61026061025b366004610f5f565b610498565b604051610231939291906111a3565b61028261027d366004610d6e565b610538565b6040516102319190611118565b6101fc61020c366004610daf565b61022461061a565b6101fc610621565b6101fc610686565b6102246102c3366004610dea565b6106b8565b6102246102d6366004610fc9565b6106ca565b6102e36106e7565b60405161023191906113a4565b6102f86106ef565b60405161023191906113af565b6101fc6106f7565b61028261031b366004610c91565b61075c565b6101fc61020c366004610f2c565b610224610765565b610349610344366004610e02565b610772565b60405161023191906112d9565b6101fc61082f565b61022461036c366004610dea565b610834565b6101fc61083a565b610224610844565b6101fc61020c366004610e9c565b610397610849565b604051610231929190611422565b6103ad610882565b6040516102319190611139565b6101fc610887565b6103ca6108be565b6040516102319190611406565b610224610a17565b6101fc6103ed366004610dea565b61020c565b6101fc61020c366004610dea565b6040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610432906112a2565b60405180910390fd5b565b50565b506107c790565b3373ffffffffffffffffffffffffffffffffffffffff167f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b658260405161048d9190611419565b60405180910390a250565b505060408051808201825260048082527f1234567800000000000000000000000000000000000000000000000000000000602080840191909152835180850185528281527f87654321000000000000000000000000000000000000000000000000000000008183015284518086019095529184527f616d657400000000000000000000000000000000000000000000000000000000908401529093909250565b600060606040518060400160405280601c81526020017f19457468657265756d205369676e6564204d6573736167653a0a3332000000008152509050600081876040516020016105899291906110f6565b604051602081830303815290604052805190602001209050600181878787604051600081526020016040526040516105c49493929190611185565b6020604051602081039080840390855afa1580156105e6573d6000803e3d6000fd5b50506040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0015198975050505050505050565b6107c75b90565b604080518082018252601481527f5245564552545f574954485f434f4e5354414e54000000000000000000000000602082015290517f08c379a000000000000000000000000000000000000000000000000000000000815261043291906004016111e5565b6040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104329061126b565b60006020819052908152604090205481565b600082815260208190526040902060018201908190555b92915050565b61061e610a1d565b61061e610a35565b604080518082018252601581527f524551554952455f574954485f434f4e5354414e540000000000000000000000602082015290517f08c379a000000000000000000000000000000000000000000000000000000000815261043291906004016111e5565b50929392505050565b6001805481019081905590565b61077a610a55565b50604080516080810182529182528051808201825260048082527f123456780000000000000000000000000000000000000000000000000000000060208381019190915280850192909252825180840184528181527f87654321000000000000000000000000000000000000000000000000000000008184015284840152825180840190935282527f616d65740000000000000000000000000000000000000000000000000000000090820152606082015290565b61043b565b60010190565b6001805481019055565b600190565b60408051808201909152600581527f68656c6c6f0000000000000000000000000000000000000000000000000000006020820152600191565b606090565b7f61a6029a4c7ddee5824d171331eecbd015d26a271310a223718b837facb5b7716040516108b4906111ff565b60405180910390a1565b6108c6610a83565b6040805160028082526060828101909352816020015b60608152602001906001900390816108dc5790505090506040518060400160405280600581526020017f30783132330000000000000000000000000000000000000000000000000000008152508160008151811061093657fe5b60200260200101819052506040518060400160405280600581526020017f30783332310000000000000000000000000000000000000000000000000000008152508160018151811061098457fe5b6020908102919091018101919091526040805160c0810182526005608082018181527f307831323300000000000000000000000000000000000000000000000000000060a0840152825281840152808201939093528051808201909152600381527f6162630000000000000000000000000000000000000000000000000000000000918101919091526060820152905090565b6104d290565b6040518060200160405280610a30610ab1565b905290565b6040518060400160405280610a48610a83565b8152602001606081525090565b6040518060800160405280610a68610ac4565b81526020016060815260200160608152602001606081525090565b604051806080016040528060608152602001600063ffffffff16815260200160608152602001606081525090565b6040518060200160405280600081525090565b60405180606001604052806000815260200160608152602001606081525090565b600082601f830112610af5578081fd5b8135610b08610b0382611462565b61143b565b8181529150602080830190840160005b83811015610b4557610b308760208435890101610b4f565b83526020928301929190910190600101610b18565b5050505092915050565b600082601f830112610b5f578081fd5b813567ffffffffffffffff811115610b75578182fd5b610ba660207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8401160161143b565b9150808252836020828501011115610bbd57600080fd5b8060208401602084013760009082016020015292915050565b600060808284031215610be7578081fd5b610bf1608061143b565b9050813567ffffffffffffffff80821115610c0b57600080fd5b610c1785838601610b4f565b8352610c268560208601610c7d565b60208401526040840135915080821115610c3f57600080fd5b610c4b85838601610ae5565b60408401526060840135915080821115610c6457600080fd5b50610c7184828501610b4f565b60608301525092915050565b803563ffffffff811681146106e157600080fd5b600080600080600060a08688031215610ca8578081fd5b8535610cb3816114b2565b945060208601359350604086013592506060860135610cd1816114b2565b949793965091946080013592915050565b60006020808385031215610cf4578182fd5b823567ffffffffffffffff811115610d0a578283fd5b80840185601f820112610d1b578384fd5b80359150610d2b610b0383611462565b82815283810190828501865b85811015610d6057610d4e8a888435880101610b4f565b84529286019290860190600101610d37565b509098975050505050505050565b60008060008060808587031215610d83578384fd5b84359350602085013560ff81168114610d9a578384fd5b93969395505050506040820135916060013590565b600060208284031215610dc0578081fd5b813567ffffffffffffffff811115610dd6578182fd5b610de284828501610b4f565b949350505050565b600060208284031215610dfb578081fd5b5035919050565b600060208284031215610e13578081fd5b813567ffffffffffffffff80821115610e2a578283fd5b81840160608187031215610e3c578384fd5b610e46606061143b565b925080358352602081013582811115610e5d578485fd5b610e6987828401610b4f565b602085015250604081013582811115610e80578485fd5b610e8c87828401610b4f565b6040850152509195945050505050565b600060208284031215610ead578081fd5b813567ffffffffffffffff80821115610ec4578283fd5b81840160408187031215610ed6578384fd5b610ee0604061143b565b9250803582811115610ef0578485fd5b610efc87828401610bd6565b845250602081013582811115610f10578485fd5b610f1c87828401610b4f565b6020850152509195945050505050565b600060208284031215610f3d578081fd5b813567ffffffffffffffff811115610f53578182fd5b610de284828501610bd6565b600080600060608486031215610f73578081fd5b83359250602084013567ffffffffffffffff80821115610f91578283fd5b610f9d87838801610b4f565b93506040860135915080821115610fb2578283fd5b50610fbf86828701610b4f565b9150509250925092565b60008060408385031215610fdb578182fd5b50508035926020909101359150565b60008151808452611002816020860160208601611482565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b60008151608084526110496080850182610fea565b6020915063ffffffff828501511682860152604084015185820360408701528181518084528484019150848582028501018584018794505b828510156110cf577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08683030184526110bb828251610fea565b600195909501949387019391508601611081565b506060880151955088810360608a01526110e98187610fea565b9998505050505050505050565b60008351611108818460208801611482565b9190910191825250602001919050565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b6000602080830181845280855180835283830191508192508381028201848801865b83811015610d60578583038552611173838351611034565b9487019492509086019060010161115b565b93845260ff9290921660208401526040830152606082015260800190565b6000606082526111b66060830186610fea565b82810360208401526111c88186610fea565b83810360408501526111da8186610fea565b979650505050505050565b6000602082526111f86020830184610fea565b9392505050565b60408082526004908201527f123456780000000000000000000000000000000000000000000000000000000060608201526080602082018190526005908201527f6c6f72656d00000000000000000000000000000000000000000000000000000060a082015260c00190565b6020808252600d908201527f53494d504c455f52455645525400000000000000000000000000000000000000604082015260600190565b6020808252600e908201527f53494d504c455f52455155495245000000000000000000000000000000000000604082015260600190565b60006020825260a08201835160806020850152805182526020810151606060208401526113096060840182610fea565b6040830151915083810360408501526113228183610fea565b935050505060208401517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0808584030160408601526113618383610fea565b604087015193508186820301606087015261137c8185610fea565b92505060608601519250808583030160808601525061139b8183610fea565b95945050505050565b905151815260200190565b6000602082528251604060208401526113cb6060840182611034565b602085015191507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe084820301604085015261139b8183610fea565b6000602082526111f86020830184611034565b90815260200190565b600083825260406020830152610de26040830184610fea565b60405181810167ffffffffffffffff8111828210171561145a57600080fd5b604052919050565b600067ffffffffffffffff821115611478578081fd5b5060209081020190565b60005b8381101561149d578181015183820152602001611485565b838111156114ac576000848401525b50505050565b73ffffffffffffffffffffffffffffffffffffffff8116811461043d57600080fdfea365627a7a723158205a98646a73bbda266999b92495c98b4f927e585bf6c08197e203d8da3d3643766c6578706572696d656e74616cf564736f6c634300050c0040';
    /**
     * a method that accepts an array of bytes
     */
    public acceptsAnArrayOfBytes = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param a the array of bytes being accepted
         */
        async callAsync(a: string[], callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isArray('a', a);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('acceptsAnArrayOfBytes(bytes[])', [a]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('acceptsAnArrayOfBytes(bytes[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param a the array of bytes being accepted
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(a: string[]): string {
            assert.isArray('a', a);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('acceptsAnArrayOfBytes(bytes[])', [a]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string[]] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('acceptsAnArrayOfBytes(bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string[]]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('acceptsAnArrayOfBytes(bytes[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public acceptsBytes = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(a: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('a', a);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('acceptsBytes(bytes)', [a]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('acceptsBytes(bytes)');
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
        getABIEncodedTransactionData(a: string): string {
            assert.isString('a', a);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('acceptsBytes(bytes)', [a]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('acceptsBytes(bytes)');
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('acceptsBytes(bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Tests decoding when the input and output are complex.
     */
    public complexInputComplexOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            complexInput: { foo: BigNumber; bar: string; car: string },
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            input: { foo: BigNumber; bar: string; car: string };
            lorem: string;
            ipsum: string;
            dolor: string;
        }> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('complexInputComplexOutput((uint256,bytes,string))', [
                complexInput,
            ]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('complexInputComplexOutput((uint256,bytes,string))');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                input: { foo: BigNumber; bar: string; car: string };
                lorem: string;
                ipsum: string;
                dolor: string;
            }>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(complexInput: { foo: BigNumber; bar: string; car: string }): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'complexInputComplexOutput((uint256,bytes,string))',
                [complexInput],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): { foo: BigNumber; bar: string; car: string } {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('complexInputComplexOutput((uint256,bytes,string))');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<{ foo: BigNumber; bar: string; car: string }>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(
            returnData: string,
        ): { input: { foo: BigNumber; bar: string; car: string }; lorem: string; ipsum: string; dolor: string } {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('complexInputComplexOutput((uint256,bytes,string))');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                input: { foo: BigNumber; bar: string; car: string };
                lorem: string;
                ipsum: string;
                dolor: string;
            }>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * test that devdocs will be generated and
     * that multiline devdocs will look okay
     */
    public ecrecoverFn = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param hash description of some hash. Let's make this line super long to
         *     demonstrate hanging indents for method params. It has to be more than
         *     one hundred twenty columns.
         * @param v some v, recovery id
         * @param r ECDSA r output
         * @param s ECDSA s output
         * @returns the signerAddress that created this signature.  this line too is super long in order to demonstrate the proper hanging indentation in generated code.
         */
        async callAsync(
            hash: string,
            v: number | BigNumber,
            r: string,
            s: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isString('hash', hash);
            assert.isNumberOrBigNumber('v', v);
            assert.isString('r', r);
            assert.isString('s', s);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('ecrecoverFn(bytes32,uint8,bytes32,bytes32)', [
                hash,
                v,
                r,
                s,
            ]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('ecrecoverFn(bytes32,uint8,bytes32,bytes32)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param hash description of some hash. Let's make this line super long to
         *     demonstrate hanging indents for method params. It has to be more than
         *     one hundred twenty columns.
         * @param v some v, recovery id
         * @param r ECDSA r output
         * @param s ECDSA s output
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(hash: string, v: number | BigNumber, r: string, s: string): string {
            assert.isString('hash', hash);
            assert.isNumberOrBigNumber('v', v);
            assert.isString('r', r);
            assert.isString('s', s);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'ecrecoverFn(bytes32,uint8,bytes32,bytes32)',
                [hash, v, r, s],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('ecrecoverFn(bytes32,uint8,bytes32,bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('ecrecoverFn(bytes32,uint8,bytes32,bytes32)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public emitSimpleEvent = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(txData?: Partial<TxData> | undefined): Promise<string> {
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('emitSimpleEvent()', []);
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
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            const self = (this as any) as AbiGenDummyContract;
            const txHashPromise = self.emitSimpleEvent.sendTransactionAsync(txData);
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
        async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('emitSimpleEvent()', []);
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
        async validateAndSendTransactionAsync(txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).emitSimpleEvent.callAsync(txData);
            const txHash = await (this as any).emitSimpleEvent.sendTransactionAsync(txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('emitSimpleEvent()', []);
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
            const abiEncoder = self._lookupAbiEncoder('emitSimpleEvent()');
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
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('emitSimpleEvent()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('emitSimpleEvent()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('emitSimpleEvent()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public methodReturningArrayOfStructs = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<Array<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }>> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('methodReturningArrayOfStructs()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('methodReturningArrayOfStructs()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<
                Array<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }>
            >(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('methodReturningArrayOfStructs()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('methodReturningArrayOfStructs()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(
            returnData: string,
        ): Array<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }> {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('methodReturningArrayOfStructs()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<
                Array<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }>
            >(returnData);
            return abiDecodedReturnData;
        },
    };
    public methodReturningMultipleValues = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<[BigNumber, string]> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('methodReturningMultipleValues()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('methodReturningMultipleValues()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[BigNumber, string]>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('methodReturningMultipleValues()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('methodReturningMultipleValues()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [BigNumber, string] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('methodReturningMultipleValues()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[BigNumber, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    public methodUsingNestedStructWithInnerStructNotUsedElsewhere = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{ innerStruct: { aField: BigNumber } }> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments(
                'methodUsingNestedStructWithInnerStructNotUsedElsewhere()',
                [],
            );
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('methodUsingNestedStructWithInnerStructNotUsedElsewhere()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{ innerStruct: { aField: BigNumber } }>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'methodUsingNestedStructWithInnerStructNotUsedElsewhere()',
                [],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('methodUsingNestedStructWithInnerStructNotUsedElsewhere()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): { innerStruct: { aField: BigNumber } } {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('methodUsingNestedStructWithInnerStructNotUsedElsewhere()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{ innerStruct: { aField: BigNumber } }>(
                returnData,
            );
            return abiDecodedReturnData;
        },
    };
    /**
     * Tests decoding when the input and output are complex and have more than one argument.
     */
    public multiInputMultiOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            index_1: string,
            index_2: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, string, string]> {
            assert.isBigNumber('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.isString('index_2', index_2);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('multiInputMultiOutput(uint256,bytes,string)', [
                index_0,
                index_1,
                index_2,
            ]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('multiInputMultiOutput(uint256,bytes,string)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, string, string]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(index_0: BigNumber, index_1: string, index_2: string): string {
            assert.isBigNumber('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.isString('index_2', index_2);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'multiInputMultiOutput(uint256,bytes,string)',
                [index_0, index_1, index_2],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [BigNumber, string, string] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('multiInputMultiOutput(uint256,bytes,string)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber, string, string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): [string, string, string] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('multiInputMultiOutput(uint256,bytes,string)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<[string, string, string]>(returnData);
            return abiDecodedReturnData;
        },
    };
    public nestedStructInput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            n: {
                innerStruct: {
                    someBytes: string;
                    anInteger: number | BigNumber;
                    aDynamicArrayOfBytes: string[];
                    aString: string;
                };
                description: string;
            },
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments(
                'nestedStructInput(((bytes,uint32,bytes[],string),string))',
                [n],
            );
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('nestedStructInput(((bytes,uint32,bytes[],string),string))');
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
        getABIEncodedTransactionData(n: {
            innerStruct: {
                someBytes: string;
                anInteger: number | BigNumber;
                aDynamicArrayOfBytes: string[];
                aString: string;
            };
            description: string;
        }): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'nestedStructInput(((bytes,uint32,bytes[],string),string))',
                [n],
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
            {
                innerStruct: { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string };
                description: string;
            }
        ] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nestedStructInput(((bytes,uint32,bytes[],string),string))');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [
                    {
                        innerStruct: {
                            someBytes: string;
                            anInteger: number;
                            aDynamicArrayOfBytes: string[];
                            aString: string;
                        };
                        description: string;
                    }
                ]
            >(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nestedStructInput(((bytes,uint32,bytes[],string),string))');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public nestedStructOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{
            innerStruct: { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string };
            description: string;
        }> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nestedStructOutput()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('nestedStructOutput()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                innerStruct: { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string };
                description: string;
            }>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('nestedStructOutput()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nestedStructOutput()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(
            returnData: string,
        ): {
            innerStruct: { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string };
            description: string;
        } {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nestedStructOutput()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                innerStruct: { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string };
                description: string;
            }>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Tests decoding when both input and output are empty.
     */
    public noInputNoOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('noInputNoOutput()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('noInputNoOutput()');
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
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('noInputNoOutput()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('noInputNoOutput()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('noInputNoOutput()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Tests decoding when input is empty and output is non-empty.
     */
    public noInputSimpleOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('noInputSimpleOutput()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('noInputSimpleOutput()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('noInputSimpleOutput()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('noInputSimpleOutput()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('noInputSimpleOutput()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public nonPureFunction = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            id: BigNumber,
            someValue: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('id', id);
            assert.isBigNumber('someValue', someValue);
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureFunction(uint256,uint256)', [id, someValue]);
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
            id: BigNumber,
            someValue: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('id', id);
            assert.isBigNumber('someValue', someValue);
            const self = (this as any) as AbiGenDummyContract;
            const txHashPromise = self.nonPureFunction.sendTransactionAsync(id, someValue, txData);
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
        async estimateGasAsync(
            id: BigNumber,
            someValue: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('id', id);
            assert.isBigNumber('someValue', someValue);
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureFunction(uint256,uint256)', [id, someValue]);
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
            id: BigNumber,
            someValue: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).nonPureFunction.callAsync(id, someValue, txData);
            const txHash = await (this as any).nonPureFunction.sendTransactionAsync(id, someValue, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            id: BigNumber,
            someValue: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('id', id);
            assert.isBigNumber('someValue', someValue);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureFunction(uint256,uint256)', [id, someValue]);
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
            const abiEncoder = self._lookupAbiEncoder('nonPureFunction(uint256,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(id: BigNumber, someValue: BigNumber): string {
            assert.isBigNumber('id', id);
            assert.isBigNumber('someValue', someValue);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('nonPureFunction(uint256,uint256)', [
                id,
                someValue,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nonPureFunction(uint256,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nonPureFunction(uint256,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public nonPureMethod = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(txData?: Partial<TxData> | undefined): Promise<string> {
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureMethod()', []);
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
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            const self = (this as any) as AbiGenDummyContract;
            const txHashPromise = self.nonPureMethod.sendTransactionAsync(txData);
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
        async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureMethod()', []);
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
        async validateAndSendTransactionAsync(txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).nonPureMethod.callAsync(txData);
            const txHash = await (this as any).nonPureMethod.sendTransactionAsync(txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureMethod()', []);
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
            const abiEncoder = self._lookupAbiEncoder('nonPureMethod()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('nonPureMethod()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nonPureMethod()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nonPureMethod()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public nonPureMethodThatReturnsNothing = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(txData?: Partial<TxData> | undefined): Promise<string> {
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureMethodThatReturnsNothing()', []);
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
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            const self = (this as any) as AbiGenDummyContract;
            const txHashPromise = self.nonPureMethodThatReturnsNothing.sendTransactionAsync(txData);
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
        async estimateGasAsync(txData?: Partial<TxData> | undefined): Promise<number> {
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureMethodThatReturnsNothing()', []);
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
        async validateAndSendTransactionAsync(txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).nonPureMethodThatReturnsNothing.callAsync(txData);
            const txHash = await (this as any).nonPureMethodThatReturnsNothing.sendTransactionAsync(txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('nonPureMethodThatReturnsNothing()', []);
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
            const abiEncoder = self._lookupAbiEncoder('nonPureMethodThatReturnsNothing()');
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
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('nonPureMethodThatReturnsNothing()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nonPureMethodThatReturnsNothing()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('nonPureMethodThatReturnsNothing()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public overloadedMethod2 = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(a: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('a', a);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('overloadedMethod(string)', [a]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('overloadedMethod(string)');
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
        getABIEncodedTransactionData(a: string): string {
            assert.isString('a', a);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('overloadedMethod(string)', [a]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('overloadedMethod(string)');
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('overloadedMethod(string)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public overloadedMethod1 = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(a: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isBigNumber('a', a);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('overloadedMethod(int256)', [a]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('overloadedMethod(int256)');
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
        getABIEncodedTransactionData(a: BigNumber): string {
            assert.isBigNumber('a', a);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('overloadedMethod(int256)', [a]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [BigNumber] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('overloadedMethod(int256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('overloadedMethod(int256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public pureFunctionWithConstant = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('pureFunctionWithConstant()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('pureFunctionWithConstant()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('pureFunctionWithConstant()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('pureFunctionWithConstant()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('pureFunctionWithConstant()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public requireWithConstant = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('requireWithConstant()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('requireWithConstant()');
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
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('requireWithConstant()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('requireWithConstant()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('requireWithConstant()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public revertWithConstant = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('revertWithConstant()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('revertWithConstant()');
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
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('revertWithConstant()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('revertWithConstant()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('revertWithConstant()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Tests decoding when input is not empty but output is empty.
     */
    public simpleInputNoOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('simpleInputNoOutput(uint256)', [index_0]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('simpleInputNoOutput(uint256)');
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
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('simpleInputNoOutput(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [BigNumber] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleInputNoOutput(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleInputNoOutput(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Tests decoding when both input and output are non-empty.
     */
    public simpleInputSimpleOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('simpleInputSimpleOutput(uint256)', [index_0]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('simpleInputSimpleOutput(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('simpleInputSimpleOutput(uint256)', [
                index_0,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleInputSimpleOutput(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleInputSimpleOutput(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public simplePureFunction = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('simplePureFunction()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('simplePureFunction()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('simplePureFunction()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simplePureFunction()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simplePureFunction()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public simplePureFunctionWithInput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(x: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<BigNumber> {
            assert.isBigNumber('x', x);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('simplePureFunctionWithInput(uint256)', [x]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('simplePureFunctionWithInput(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(x: BigNumber): string {
            assert.isBigNumber('x', x);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('simplePureFunctionWithInput(uint256)', [x]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simplePureFunctionWithInput(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simplePureFunctionWithInput(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public simpleRequire = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('simpleRequire()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('simpleRequire()');
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
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('simpleRequire()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleRequire()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleRequire()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public simpleRevert = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('simpleRevert()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('simpleRevert()');
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
        getABIEncodedTransactionData(): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('simpleRevert()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleRevert()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('simpleRevert()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public someMapping = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('someMapping(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('someMapping(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('someMapping(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('someMapping(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('someMapping(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public structInput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            s: { someBytes: string; anInteger: number | BigNumber; aDynamicArrayOfBytes: string[]; aString: string },
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('structInput((bytes,uint32,bytes[],string))', [s]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('structInput((bytes,uint32,bytes[],string))');
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
        getABIEncodedTransactionData(s: {
            someBytes: string;
            anInteger: number | BigNumber;
            aDynamicArrayOfBytes: string[];
            aString: string;
        }): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'structInput((bytes,uint32,bytes[],string))',
                [s],
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
        ): [{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('structInput((bytes,uint32,bytes[],string))');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<
                [{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }]
            >(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('structInput((bytes,uint32,bytes[],string))');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * a method that returns a struct
     */
    public structOutput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @returns a Struct struct
         */
        async callAsync(
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<{ someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string }> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('structOutput()', []);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('structOutput()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<{
                someBytes: string;
                anInteger: number;
                aDynamicArrayOfBytes: string[];
                aString: string;
            }>(rawCallResult);
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
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('structOutput()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('structOutput()');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<void>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(
            returnData: string,
        ): { someBytes: string; anInteger: number; aDynamicArrayOfBytes: string[]; aString: string } {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('structOutput()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<{
                someBytes: string;
                anInteger: number;
                aDynamicArrayOfBytes: string[];
                aString: string;
            }>(returnData);
            return abiDecodedReturnData;
        },
    };
    public withAddressInput = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            x: string,
            a: BigNumber,
            b: BigNumber,
            y: string,
            c: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isString('x', x);
            assert.isBigNumber('a', a);
            assert.isBigNumber('b', b);
            assert.isString('y', y);
            assert.isBigNumber('c', c);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments(
                'withAddressInput(address,uint256,uint256,address,uint256)',
                [x.toLowerCase(), a, b, y.toLowerCase(), c],
            );
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self._evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('withAddressInput(address,uint256,uint256,address,uint256)');
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
        getABIEncodedTransactionData(x: string, a: BigNumber, b: BigNumber, y: string, c: BigNumber): string {
            assert.isString('x', x);
            assert.isBigNumber('a', a);
            assert.isBigNumber('b', b);
            assert.isString('y', y);
            assert.isBigNumber('c', c);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'withAddressInput(address,uint256,uint256,address,uint256)',
                [x.toLowerCase(), a, b, y.toLowerCase(), c],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('withAddressInput(address,uint256,uint256,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('withAddressInput(address,uint256,uint256,address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public withdraw = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(wad: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('wad', wad);
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('withdraw(uint256)', [wad]);
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
            wad: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('wad', wad);
            const self = (this as any) as AbiGenDummyContract;
            const txHashPromise = self.withdraw.sendTransactionAsync(wad, txData);
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
        async estimateGasAsync(wad: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('wad', wad);
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('withdraw(uint256)', [wad]);
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
        async validateAndSendTransactionAsync(wad: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).withdraw.callAsync(wad, txData);
            const txHash = await (this as any).withdraw.sendTransactionAsync(wad, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(wad: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isBigNumber('wad', wad);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AbiGenDummyContract;
            const encodedData = self._strictEncodeArguments('withdraw(uint256)', [wad]);
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
            const abiEncoder = self._lookupAbiEncoder('withdraw(uint256)');
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
        getABIEncodedTransactionData(wad: BigNumber): string {
            assert.isBigNumber('wad', wad);
            const self = (this as any) as AbiGenDummyContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('withdraw(uint256)', [wad]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [BigNumber] {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('withdraw(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as AbiGenDummyContract;
            const abiEncoder = self._lookupAbiEncoder('withdraw(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<AbiGenDummyEventArgs, AbiGenDummyEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<AbiGenDummyContract> {
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
        return AbiGenDummyContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<AbiGenDummyContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [] = BaseContract._formatABIDataItemList(constructorAbi.inputs, [], BaseContract._bigNumberToString);
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, []);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`AbiGenDummy successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new AbiGenDummyContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [];
        return contractInstance;
    }

    /**
     * @returns      The contract ABI
     */
    public static ABI(): ContractAbi {
        const abi = [
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'someBytes',
                        type: 'bytes',
                        indexed: false,
                    },
                    {
                        name: 'someString',
                        type: 'string',
                        indexed: false,
                    },
                ],
                name: 'SimpleEvent',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Withdrawal',
                outputs: [],
                type: 'event',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'bytes[]',
                    },
                ],
                name: 'acceptsAnArrayOfBytes',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'bytes',
                    },
                ],
                name: 'acceptsBytes',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'complexInput',
                        type: 'tuple',
                        components: [
                            {
                                name: 'foo',
                                type: 'uint256',
                            },
                            {
                                name: 'bar',
                                type: 'bytes',
                            },
                            {
                                name: 'car',
                                type: 'string',
                            },
                        ],
                    },
                ],
                name: 'complexInputComplexOutput',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'input',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'foo',
                                        type: 'uint256',
                                    },
                                    {
                                        name: 'bar',
                                        type: 'bytes',
                                    },
                                    {
                                        name: 'car',
                                        type: 'string',
                                    },
                                ],
                            },
                            {
                                name: 'lorem',
                                type: 'bytes',
                            },
                            {
                                name: 'ipsum',
                                type: 'bytes',
                            },
                            {
                                name: 'dolor',
                                type: 'string',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'hash',
                        type: 'bytes32',
                    },
                    {
                        name: 'v',
                        type: 'uint8',
                    },
                    {
                        name: 'r',
                        type: 'bytes32',
                    },
                    {
                        name: 's',
                        type: 'bytes32',
                    },
                ],
                name: 'ecrecoverFn',
                outputs: [
                    {
                        name: 'signerAddress',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'emitSimpleEvent',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'methodReturningArrayOfStructs',
                outputs: [
                    {
                        name: '',
                        type: 'tuple[]',
                        components: [
                            {
                                name: 'someBytes',
                                type: 'bytes',
                            },
                            {
                                name: 'anInteger',
                                type: 'uint32',
                            },
                            {
                                name: 'aDynamicArrayOfBytes',
                                type: 'bytes[]',
                            },
                            {
                                name: 'aString',
                                type: 'string',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'methodReturningMultipleValues',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'methodUsingNestedStructWithInnerStructNotUsedElsewhere',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'innerStruct',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'aField',
                                        type: 'uint256',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                    {
                        name: 'index_1',
                        type: 'bytes',
                    },
                    {
                        name: 'index_2',
                        type: 'string',
                    },
                ],
                name: 'multiInputMultiOutput',
                outputs: [
                    {
                        name: '',
                        type: 'bytes',
                    },
                    {
                        name: '',
                        type: 'bytes',
                    },
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'n',
                        type: 'tuple',
                        components: [
                            {
                                name: 'innerStruct',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'someBytes',
                                        type: 'bytes',
                                    },
                                    {
                                        name: 'anInteger',
                                        type: 'uint32',
                                    },
                                    {
                                        name: 'aDynamicArrayOfBytes',
                                        type: 'bytes[]',
                                    },
                                    {
                                        name: 'aString',
                                        type: 'string',
                                    },
                                ],
                            },
                            {
                                name: 'description',
                                type: 'string',
                            },
                        ],
                    },
                ],
                name: 'nestedStructInput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'nestedStructOutput',
                outputs: [
                    {
                        name: '',
                        type: 'tuple',
                        components: [
                            {
                                name: 'innerStruct',
                                type: 'tuple',
                                components: [
                                    {
                                        name: 'someBytes',
                                        type: 'bytes',
                                    },
                                    {
                                        name: 'anInteger',
                                        type: 'uint32',
                                    },
                                    {
                                        name: 'aDynamicArrayOfBytes',
                                        type: 'bytes[]',
                                    },
                                    {
                                        name: 'aString',
                                        type: 'string',
                                    },
                                ],
                            },
                            {
                                name: 'description',
                                type: 'string',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'noInputNoOutput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'noInputSimpleOutput',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'id',
                        type: 'uint256',
                    },
                    {
                        name: 'someValue',
                        type: 'uint256',
                    },
                ],
                name: 'nonPureFunction',
                outputs: [
                    {
                        name: 'result',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'nonPureMethod',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [],
                name: 'nonPureMethodThatReturnsNothing',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'string',
                    },
                ],
                name: 'overloadedMethod',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'a',
                        type: 'int256',
                    },
                ],
                name: 'overloadedMethod',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'pureFunctionWithConstant',
                outputs: [
                    {
                        name: 'someConstant',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'requireWithConstant',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'revertWithConstant',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'simpleInputNoOutput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'simpleInputSimpleOutput',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'simplePureFunction',
                outputs: [
                    {
                        name: 'result',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'x',
                        type: 'uint256',
                    },
                ],
                name: 'simplePureFunctionWithInput',
                outputs: [
                    {
                        name: 'sum',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'simpleRequire',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'simpleRevert',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'someMapping',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 's',
                        type: 'tuple',
                        components: [
                            {
                                name: 'someBytes',
                                type: 'bytes',
                            },
                            {
                                name: 'anInteger',
                                type: 'uint32',
                            },
                            {
                                name: 'aDynamicArrayOfBytes',
                                type: 'bytes[]',
                            },
                            {
                                name: 'aString',
                                type: 'string',
                            },
                        ],
                    },
                ],
                name: 'structInput',
                outputs: [],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'structOutput',
                outputs: [
                    {
                        name: 's',
                        type: 'tuple',
                        components: [
                            {
                                name: 'someBytes',
                                type: 'bytes',
                            },
                            {
                                name: 'anInteger',
                                type: 'uint32',
                            },
                            {
                                name: 'aDynamicArrayOfBytes',
                                type: 'bytes[]',
                            },
                            {
                                name: 'aString',
                                type: 'string',
                            },
                        ],
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'x',
                        type: 'address',
                    },
                    {
                        name: 'a',
                        type: 'uint256',
                    },
                    {
                        name: 'b',
                        type: 'uint256',
                    },
                    {
                        name: 'y',
                        type: 'address',
                    },
                    {
                        name: 'c',
                        type: 'uint256',
                    },
                ],
                name: 'withAddressInput',
                outputs: [
                    {
                        name: 'z',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'pure',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'wad',
                        type: 'uint256',
                    },
                ],
                name: 'withdraw',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the AbiGenDummy contract.
     * @param eventName The AbiGenDummy contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends AbiGenDummyEventArgs>(
        eventName: AbiGenDummyEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, AbiGenDummyEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            AbiGenDummyContract.ABI(),
            callback,
            isVerbose,
            blockPollingIntervalMs,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._subscriptionManager.unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        this._subscriptionManager.unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The AbiGenDummy contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends AbiGenDummyEventArgs>(
        eventName: AbiGenDummyEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, AbiGenDummyEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            AbiGenDummyContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = AbiGenDummyContract.deployedBytecode,
    ) {
        super(
            'AbiGenDummy',
            AbiGenDummyContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<AbiGenDummyEventArgs, AbiGenDummyEvents>(
            AbiGenDummyContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
