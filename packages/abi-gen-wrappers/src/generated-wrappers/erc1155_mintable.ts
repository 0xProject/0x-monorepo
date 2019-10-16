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

export type ERC1155MintableEventArgs =
    | ERC1155MintableApprovalForAllEventArgs
    | ERC1155MintableTransferBatchEventArgs
    | ERC1155MintableTransferSingleEventArgs
    | ERC1155MintableURIEventArgs;

export enum ERC1155MintableEvents {
    ApprovalForAll = 'ApprovalForAll',
    TransferBatch = 'TransferBatch',
    TransferSingle = 'TransferSingle',
    URI = 'URI',
}

export interface ERC1155MintableApprovalForAllEventArgs extends DecodedLogArgs {
    owner: string;
    operator: string;
    approved: boolean;
}

export interface ERC1155MintableTransferBatchEventArgs extends DecodedLogArgs {
    operator: string;
    from: string;
    to: string;
    ids: BigNumber[];
    values: BigNumber[];
}

export interface ERC1155MintableTransferSingleEventArgs extends DecodedLogArgs {
    operator: string;
    from: string;
    to: string;
    id: BigNumber;
    value: BigNumber;
}

export interface ERC1155MintableURIEventArgs extends DecodedLogArgs {
    value: string;
    id: BigNumber;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class ERC1155MintableContract extends BaseContract {
    public static deployedBytecode =
        '0x608060405234801561001057600080fd5b50600436106101765760003560e01c80639f4b286a116100d8578063e0a5c9491161008c578063f242432a11610066578063f242432a146107bb578063f94190881461085d578063fc67bf1c146108d457610176565b8063e0a5c94914610726578063e44591f014610763578063e985e9c51461078057610176565b8063adebf6f2116100bd578063adebf6f21461067a578063cc10e40114610697578063cd53d08e1461070957610176565b80639f4b286a146105c8578063a22cb4651461063f57610176565b80636352211e1161012f5780637269a327116101145780637269a327146104c557806378b27221146104e25780639cca1c64146105ab57610176565b80636352211e146104625780636f969c2d146104a857610176565b80632eb2c2d6116101605780632eb2c2d6146101e35780634e1273f41461031f5780635e81b9581461043157610176565b8062fdd58e1461017b57806308d7d469146101c6575b600080fd5b6101b46004803603604081101561019157600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81351690602001356108dc565b60408051918252519081900360200190f35b6101b4600480360360208110156101dc57600080fd5b5035610966565b61031d600480360360a08110156101f957600080fd5b73ffffffffffffffffffffffffffffffffffffffff823581169260208101359091169181019060608101604082013564010000000081111561023a57600080fd5b82018360208201111561024c57600080fd5b8035906020019184602083028401116401000000008311171561026e57600080fd5b91939092909160208101903564010000000081111561028c57600080fd5b82018360208201111561029e57600080fd5b803590602001918460208302840111640100000000831117156102c057600080fd5b9193909290916020810190356401000000008111156102de57600080fd5b8201836020820111156102f057600080fd5b8035906020019184600183028401116401000000008311171561031257600080fd5b509092509050610978565b005b6103e16004803603604081101561033557600080fd5b81019060208101813564010000000081111561035057600080fd5b82018360208201111561036257600080fd5b8035906020019184602083028401116401000000008311171561038457600080fd5b9193909290916020810190356401000000008111156103a257600080fd5b8201836020820111156103b457600080fd5b803590602001918460208302840111640100000000831117156103d657600080fd5b509092509050611192565b60408051602080825283518183015283519192839290830191858101910280838360005b8381101561041d578181015183820152602001610405565b505050509050019250505060405180910390f35b61044e6004803603602081101561044757600080fd5b5035611357565b604080519115158252519081900360200190f35b61047f6004803603602081101561047857600080fd5b503561139d565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b6101b4600480360360208110156104be57600080fd5b50356113c5565b61044e600480360360208110156104db57600080fd5b50356113ea565b61031d600480360360608110156104f857600080fd5b8135919081019060408101602082013564010000000081111561051a57600080fd5b82018360208201111561052c57600080fd5b8035906020019184602083028401116401000000008311171561054e57600080fd5b91939092909160208101903564010000000081111561056c57600080fd5b82018360208201111561057e57600080fd5b803590602001918460208302840111640100000000831117156105a057600080fd5b50909250905061142f565b6101b4600480360360208110156105c157600080fd5b5035611760565b61031d600480360360408110156105de57600080fd5b8135919081019060408101602082013564010000000081111561060057600080fd5b82018360208201111561061257600080fd5b8035906020019184600183028401116401000000008311171561063457600080fd5b509092509050611775565b61031d6004803603604081101561065557600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81351690602001351515611875565b61044e6004803603602081101561069057600080fd5b503561190e565b6101b4600480360360408110156106ad57600080fd5b8101906020810181356401000000008111156106c857600080fd5b8201836020820111156106da57600080fd5b803590602001918460018302840111640100000000831117156106fc57600080fd5b9193509150351515611934565b61047f6004803603602081101561071f57600080fd5b5035611a6d565b61072e611a95565b604080517fffffffff000000000000000000000000000000000000000000000000000000009092168252519081900360200190f35b61044e6004803603602081101561077957600080fd5b5035611ab9565b61044e6004803603604081101561079657600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81358116916020013516611ae1565b61031d600480360360a08110156107d157600080fd5b73ffffffffffffffffffffffffffffffffffffffff823581169260208101359091169160408201359160608101359181019060a08101608082013564010000000081111561081e57600080fd5b82018360208201111561083057600080fd5b8035906020019184600183028401116401000000008311171561085257600080fd5b509092509050611b1c565b61031d6004803603604081101561087357600080fd5b8135919081019060408101602082013564010000000081111561089557600080fd5b8201836020820111156108a757600080fd5b803590602001918460208302840111640100000000831117156108c957600080fd5b5090925090506120fb565b61072e61242b565b60006108e782611357565b1561092e5760008281526020819052604090205473ffffffffffffffffffffffffffffffffffffffff848116911614610921576000610924565b60015b60ff169050610960565b50600081815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff861684529091529020545b92915050565b60056020526000908152604090205481565b73ffffffffffffffffffffffffffffffffffffffff87166109fa57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601f60248201527f43414e4e4f545f5452414e534645525f544f5f414444524553535f5a45524f00604482015290519081900360640190fd5b848314610a6857604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f544f4b454e5f414e445f56414c5545535f4c454e4754485f4d49534d41544348604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8816331480610ac1575073ffffffffffffffffffffffffffffffffffffffff8816600090815260026020908152604080832033845290915290205460ff1615156001145b610b2c57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601660248201527f494e53554646494349454e545f414c4c4f57414e434500000000000000000000604482015290519081900360640190fd5b60005b85811015610deb576000878783818110610b4557fe5b9050602002013590506000868684818110610b5c57fe5b905060200201359050610b6e82611ab9565b15610cc85780600114610be257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601c60248201527f414d4f554e545f455155414c5f544f5f4f4e455f524551554952454400000000604482015290519081900360640190fd5b60008281526020819052604090205473ffffffffffffffffffffffffffffffffffffffff8c8116911614610c7757604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f4e46545f4e4f545f4f574e45445f42595f46524f4d5f41444452455353000000604482015290519081900360640190fd5b600082815260208190526040902080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff8c16179055610de1565b600082815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff8f168452909152902054610d02908261244f565b6001600084815260200190815260200160002060008d73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610db06001600084815260200190815260200160002060008c73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205482612473565b600083815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff8f1684529091529020555b5050600101610b2f565b508673ffffffffffffffffffffffffffffffffffffffff168873ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb898989896040518080602001806020018381038352878782818152602001925060200280828437600083820152601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169091018481038352858152602090810191508690860280828437600083820152604051601f9091017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169092018290039850909650505050505050a4610f1f8773ffffffffffffffffffffffffffffffffffffffff1661248f565b156111885760008773ffffffffffffffffffffffffffffffffffffffff1663bc197c81338b8a8a8a8a8a8a6040518963ffffffff1660e01b8152600401808973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200180602001806020018060200184810384528a8a82818152602001925060200280828437600083820152601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169091018581038452888152602090810191508990890280828437600083820152601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01690910185810383528681526020019050868680828437600081840152601f19601f8201169050808301925050509b505050505050505050505050602060405180830381600087803b1580156110a857600080fd5b505af11580156110bc573d6000803e3d6000fd5b505050506040513d60208110156110d257600080fd5b505190507fffffffff0000000000000000000000000000000000000000000000000000000081167fbc197c81000000000000000000000000000000000000000000000000000000001461118657604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f4241445f52454345495645525f52455455524e5f56414c554500000000000000604482015290519081900360640190fd5b505b5050505050505050565b60608382146111ec576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602481526020018061256a6024913960400191505060405180910390fd5b604080518581526020808702820101909152848015611215578160200160208202803883390190505b50905060005b8481101561134e57600084848381811061123157fe5b90506020020135905061124381611357565b156112b95786868381811061125457fe5b600084815260208181526040909120549102929092013573ffffffffffffffffffffffffffffffffffffffff9081169216919091149050611296576000611299565b60015b60ff168383815181106112a857fe5b602002602001018181525050611345565b6000818152600160205260408120908888858181106112d457fe5b9050602002013573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205483838151811061133857fe5b6020026020010181815250505b5060010161121b565b50949350505050565b60007f80000000000000000000000000000000000000000000000000000000000000008083161480156109605750506fffffffffffffffffffffffffffffffff16151590565b60009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b7fffffffffffffffffffffffffffffffff000000000000000000000000000000001690565b60007f80000000000000000000000000000000000000000000000000000000000000008083161480156109605750506fffffffffffffffffffffffffffffffff161590565b600085815260046020526040902054859073ffffffffffffffffffffffffffffffffffffffff16331461146157600080fd5b61146a8661190e565b6114bf576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602d81526020018061258e602d913960400191505060405180910390fd5b60005b848110156117575760008686838181106114d857fe5b9050602002013573ffffffffffffffffffffffffffffffffffffffff169050600085858481811061150557fe5b60008c815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff8916845282529091205491029290920135925061154a91839150612473565b60008a815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff87168085529083528184209490945580518d8152918201859052805133927fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f6292908290030190a46115d68273ffffffffffffffffffffffffffffffffffffffff1661248f565b1561174d57604080517ff23a6e6100000000000000000000000000000000000000000000000000000000815233600482018190526024820152604481018b90526064810183905260a06084820152600060a48201819052915173ffffffffffffffffffffffffffffffffffffffff85169163f23a6e619160e480830192602092919082900301818787803b15801561166d57600080fd5b505af1158015611681573d6000803e3d6000fd5b505050506040513d602081101561169757600080fd5b505190507fffffffff0000000000000000000000000000000000000000000000000000000081167ff23a6e61000000000000000000000000000000000000000000000000000000001461174b57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f4241445f52454345495645525f52455455524e5f56414c554500000000000000604482015290519081900360640190fd5b505b50506001016114c2565b50505050505050565b6fffffffffffffffffffffffffffffffff1690565b600083815260046020908152604080832080547fffffffffffffffffffffffff0000000000000000000000000000000000000000163390811790915581518781529283018490528151849391927fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62928290030190a4801561187057827f6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b838360405180806020018281038252848482818152602001925080828437600083820152604051601f9091017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169092018290039550909350505050a25b505050565b33600081815260026020908152604080832073ffffffffffffffffffffffffffffffffffffffff87168085529083529281902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0016861515908117909155815190815290519293927f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31929181900390910190a35050565b7f8000000000000000000000000000000000000000000000000000000000000000161590565b600380546001019081905560801b811561196b577f8000000000000000000000000000000000000000000000000000000000000000175b600081815260046020908152604080832080547fffffffffffffffffffffffff0000000000000000000000000000000000000000163390811790915581518581529283018490528151849391927fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62928290030190a48215611a6657807f6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b858560405180806020018281038252848482818152602001925080828437600083820152604051601f9091017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169092018290039550909350505050a25b9392505050565b60046020526000908152604090205473ffffffffffffffffffffffffffffffffffffffff1681565b7ff23a6e610000000000000000000000000000000000000000000000000000000081565b7f80000000000000000000000000000000000000000000000000000000000000009081161490565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260026020908152604080832093909416825291909152205460ff1690565b73ffffffffffffffffffffffffffffffffffffffff8516611b9e57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601f60248201527f43414e4e4f545f5452414e534645525f544f5f414444524553535f5a45524f00604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8616331480611bf7575073ffffffffffffffffffffffffffffffffffffffff8616600090815260026020908152604080832033845290915290205460ff1615156001145b611c6257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601660248201527f494e53554646494349454e545f414c4c4f57414e434500000000000000000000604482015290519081900360640190fd5b611c6b84611ab9565b15611dc55782600114611cdf57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601c60248201527f414d4f554e545f455155414c5f544f5f4f4e455f524551554952454400000000604482015290519081900360640190fd5b60008481526020819052604090205473ffffffffffffffffffffffffffffffffffffffff878116911614611d7457604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f4e46545f4e4f545f4f574e45445f42595f46524f4d5f41444452455353000000604482015290519081900360640190fd5b600084815260208190526040902080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff8716179055611e74565b600084815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff8a168452909152902054611dff908461244f565b600085815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff8b81168552925280832093909355871681522054611e439084612473565b600085815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff8a1684529091529020555b8473ffffffffffffffffffffffffffffffffffffffff168673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f628787604051808381526020018281526020019250505060405180910390a4611f178573ffffffffffffffffffffffffffffffffffffffff1661248f565b156120f35760008573ffffffffffffffffffffffffffffffffffffffff1663f23a6e613389888888886040518763ffffffff1660e01b8152600401808773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001858152602001848152602001806020018281038252848482818152602001925080828437600081840152601f19601f820116905080830192505050975050505050505050602060405180830381600087803b15801561201557600080fd5b505af1158015612029573d6000803e3d6000fd5b505050506040513d602081101561203f57600080fd5b505190507fffffffff0000000000000000000000000000000000000000000000000000000081167ff23a6e61000000000000000000000000000000000000000000000000000000001461175757604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f4241445f52454345495645525f52455455524e5f56414c554500000000000000604482015290519081900360640190fd5b505050505050565b600083815260046020526040902054839073ffffffffffffffffffffffffffffffffffffffff16331461212d57600080fd5b61213684611ab9565b61218b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602d81526020018061253d602d913960400191505060405180910390fd5b600084815260056020526040812054600101905b838110156123f75760008585838181106121b557fe5b8486018a176000818152602081815260408083208054958302979097013573ffffffffffffffffffffffffffffffffffffffff167fffffffffffffffffffffffff00000000000000000000000000000000000000009095168517909655855183815260019181019190915285519396509194869450909233927fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f6292908290030190a46122768273ffffffffffffffffffffffffffffffffffffffff1661248f565b156123ed57604080517ff23a6e6100000000000000000000000000000000000000000000000000000000815233600482018190526024820152604481018390526001606482015260a06084820152600060a48201819052915173ffffffffffffffffffffffffffffffffffffffff85169163f23a6e619160e480830192602092919082900301818787803b15801561230d57600080fd5b505af1158015612321573d6000803e3d6000fd5b505050506040513d602081101561233757600080fd5b505190507fffffffff0000000000000000000000000000000000000000000000000000000081167ff23a6e6100000000000000000000000000000000000000000000000000000000146123eb57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f4241445f52454345495645525f52455455524e5f56414c554500000000000000604482015290519081900360640190fd5b505b505060010161219f565b50600085815260056020526040902054612412908490612473565b6000958652600560205260409095209490945550505050565b7fbc197c810000000000000000000000000000000000000000000000000000000081565b60008282111561246d5761246d61246860028585612495565b612534565b50900390565b600082820183811015611a6657611a6661246860008686612495565b3b151590565b606063e946c1bb60e01b848484604051602401808460038111156124b557fe5b60ff1681526020018381526020018281526020019350505050604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505090509392505050565b805160208201fdfe54524945445f544f5f4d494e545f4e4f4e5f46554e4749424c455f464f525f46554e4749424c455f544f4b454e4f574e4552535f414e445f4944535f4d5553545f484156455f53414d455f4c454e47544854524945445f544f5f4d494e545f46554e4749424c455f464f525f4e4f4e5f46554e4749424c455f544f4b454ea265627a7a723158205af7d187cbffb255b374d24e5838a04f6b3a3245622025907396b2a61f9d93da64736f6c634300050c0032';
    public ERC1155_BATCH_RECEIVED = {
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
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('ERC1155_BATCH_RECEIVED()', []);
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
            const abiEncoder = self._lookupAbiEncoder('ERC1155_BATCH_RECEIVED()');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ERC1155_BATCH_RECEIVED()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('ERC1155_BATCH_RECEIVED()');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('ERC1155_BATCH_RECEIVED()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public ERC1155_RECEIVED = {
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
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('ERC1155_RECEIVED()', []);
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
            const abiEncoder = self._lookupAbiEncoder('ERC1155_RECEIVED()');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ERC1155_RECEIVED()', []);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('ERC1155_RECEIVED()');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('ERC1155_RECEIVED()');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    public balanceOf = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param owner The address of the token holder
         * @param id ID of the Token
         * @returns The _owner&#x27;s balance of the Token type requested
         */
        async callAsync(
            owner: string,
            id: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('owner', owner);
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('balanceOf(address,uint256)', [owner.toLowerCase(), id]);
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
            const abiEncoder = self._lookupAbiEncoder('balanceOf(address,uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param owner The address of the token holder
         * @param id ID of the Token
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(owner: string, id: BigNumber): string {
            assert.isString('owner', owner);
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('balanceOf(address,uint256)', [
                owner.toLowerCase(),
                id,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('balanceOf(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('balanceOf(address,uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public balanceOfBatch = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param owners The addresses of the token holders
         * @param ids ID of the Tokens
         * @returns The _owner&#x27;s balance of the Token types requested
         */
        async callAsync(
            owners: string[],
            ids: BigNumber[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]> {
            assert.isArray('owners', owners);
            assert.isArray('ids', ids);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('balanceOfBatch(address[],uint256[])', [owners, ids]);
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
            const abiEncoder = self._lookupAbiEncoder('balanceOfBatch(address[],uint256[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param owners The addresses of the token holders
         * @param ids ID of the Tokens
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(owners: string[], ids: BigNumber[]): string {
            assert.isArray('owners', owners);
            assert.isArray('ids', ids);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('balanceOfBatch(address[],uint256[])', [
                owners,
                ids,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string[] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('balanceOfBatch(address[],uint256[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string[]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber[] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('balanceOfBatch(address[],uint256[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber[]>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * creates a new token
     */
    public create = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param uri URI of token
         * @param isNF is non-fungible token
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(uri: string, isNF: boolean, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('uri', uri);
            assert.isBoolean('isNF', isNF);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('create(string,bool)', [uri, isNF]);
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
         * @param uri URI of token
         * @param isNF is non-fungible token
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            uri: string,
            isNF: boolean,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('uri', uri);
            assert.isBoolean('isNF', isNF);
            const self = (this as any) as ERC1155MintableContract;
            const txHashPromise = self.create.sendTransactionAsync(uri, isNF, txData);
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
         * @param uri URI of token
         * @param isNF is non-fungible token
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(uri: string, isNF: boolean, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('uri', uri);
            assert.isBoolean('isNF', isNF);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('create(string,bool)', [uri, isNF]);
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
            uri: string,
            isNF: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).create.callAsync(uri, isNF, txData);
            const txHash = await (this as any).create.sendTransactionAsync(uri, isNF, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param uri URI of token
         * @param isNF is non-fungible token
         * @returns type_ of token (a unique identifier)
         */
        async callAsync(
            uri: string,
            isNF: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('uri', uri);
            assert.isBoolean('isNF', isNF);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('create(string,bool)', [uri, isNF]);
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
            const abiEncoder = self._lookupAbiEncoder('create(string,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param uri URI of token
         * @param isNF is non-fungible token
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(uri: string, isNF: boolean): string {
            assert.isString('uri', uri);
            assert.isBoolean('isNF', isNF);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('create(string,bool)', [uri, isNF]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('create(string,bool)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('create(string,bool)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * creates a new token
     */
    public createWithType = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param type_ of token
         * @param uri URI of token
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            type_: BigNumber,
            uri: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('type_', type_);
            assert.isString('uri', uri);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('createWithType(uint256,string)', [type_, uri]);
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
         * @param type_ of token
         * @param uri URI of token
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            type_: BigNumber,
            uri: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('type_', type_);
            assert.isString('uri', uri);
            const self = (this as any) as ERC1155MintableContract;
            const txHashPromise = self.createWithType.sendTransactionAsync(type_, uri, txData);
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
         * @param type_ of token
         * @param uri URI of token
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(type_: BigNumber, uri: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('type_', type_);
            assert.isString('uri', uri);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('createWithType(uint256,string)', [type_, uri]);
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
            type_: BigNumber,
            uri: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).createWithType.callAsync(type_, uri, txData);
            const txHash = await (this as any).createWithType.sendTransactionAsync(type_, uri, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param type_ of token
         * @param uri URI of token
         */
        async callAsync(
            type_: BigNumber,
            uri: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('type_', type_);
            assert.isString('uri', uri);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('createWithType(uint256,string)', [type_, uri]);
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
            const abiEncoder = self._lookupAbiEncoder('createWithType(uint256,string)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param type_ of token
         * @param uri URI of token
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(type_: BigNumber, uri: string): string {
            assert.isBigNumber('type_', type_);
            assert.isString('uri', uri);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('createWithType(uint256,string)', [
                type_,
                uri,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [BigNumber, string] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('createWithType(uint256,string)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber, string]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('createWithType(uint256,string)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    public creators = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('creators(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('creators(uint256)');
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
        getABIEncodedTransactionData(index_0: BigNumber): string {
            assert.isBigNumber('index_0', index_0);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('creators(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('creators(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('creators(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns base type of non-fungible token
     */
    public getNonFungibleBaseType = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            id: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('getNonFungibleBaseType(uint256)', [id]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('getNonFungibleBaseType(uint256)');
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
        getABIEncodedTransactionData(id: BigNumber): string {
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getNonFungibleBaseType(uint256)', [id]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('getNonFungibleBaseType(uint256)');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('getNonFungibleBaseType(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns index of non-fungible token
     */
    public getNonFungibleIndex = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            id: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('getNonFungibleIndex(uint256)', [id]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('getNonFungibleIndex(uint256)');
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
        getABIEncodedTransactionData(id: BigNumber): string {
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('getNonFungibleIndex(uint256)', [id]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('getNonFungibleIndex(uint256)');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('getNonFungibleIndex(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    public isApprovedForAll = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param owner The owner of the Tokens
         * @param operator Address of authorized operator
         * @returns True if the operator is approved, false if not
         */
        async callAsync(
            owner: string,
            operator: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('owner', owner);
            assert.isString('operator', operator);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('isApprovedForAll(address,address)', [
                owner.toLowerCase(),
                operator.toLowerCase(),
            ]);
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
            const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param owner The owner of the Tokens
         * @param operator Address of authorized operator
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(owner: string, operator: string): string {
            assert.isString('owner', owner);
            assert.isString('operator', operator);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isApprovedForAll(address,address)', [
                owner.toLowerCase(),
                operator.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): string {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<string>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isApprovedForAll(address,address)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns true if token is fungible
     */
    public isFungible = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(id: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('isFungible(uint256)', [id]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('isFungible(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(id: BigNumber): string {
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isFungible(uint256)', [id]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isFungible(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isFungible(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns true if token is non-fungible
     */
    public isNonFungible = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(id: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('isNonFungible(uint256)', [id]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('isNonFungible(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(id: BigNumber): string {
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isNonFungible(uint256)', [id]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isNonFungible(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isNonFungible(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns true if input is base-type of a non-fungible token
     */
    public isNonFungibleBaseType = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(id: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('isNonFungibleBaseType(uint256)', [id]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('isNonFungibleBaseType(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(id: BigNumber): string {
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isNonFungibleBaseType(uint256)', [id]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isNonFungibleBaseType(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isNonFungibleBaseType(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * Returns true if input is a non-fungible token
     */
    public isNonFungibleItem = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(id: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<boolean> {
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('isNonFungibleItem(uint256)', [id]);
            const encodedDataBytes = Buffer.from(encodedData.substr(2), 'hex');

            let rawCallResult;
            try {
                rawCallResult = await self.evmExecAsync(encodedDataBytes);
            } catch (err) {
                BaseContract._throwIfThrownErrorIsRevertError(err);
                throw err;
            }
            BaseContract._throwIfCallResultIsRevertError(rawCallResult);

            const abiEncoder = self._lookupAbiEncoder('isNonFungibleItem(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(id: BigNumber): string {
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('isNonFungibleItem(uint256)', [id]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isNonFungibleItem(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): boolean {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('isNonFungibleItem(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<boolean>(returnData);
            return abiDecodedReturnData;
        },
    };
    public maxIndex = {
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
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('maxIndex(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('maxIndex(uint256)');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('maxIndex(uint256)', [index_0]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('maxIndex(uint256)');
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
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('maxIndex(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<BigNumber>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * mints fungible tokens
     */
    public mintFungible = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param id token type
         * @param to beneficiaries of minted tokens
         * @param quantities amounts of minted tokens
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            id: BigNumber,
            to: string[],
            quantities: BigNumber[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('id', id);
            assert.isArray('to', to);
            assert.isArray('quantities', quantities);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('mintFungible(uint256,address[],uint256[])', [
                id,
                to,
                quantities,
            ]);
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
         * @param id token type
         * @param to beneficiaries of minted tokens
         * @param quantities amounts of minted tokens
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            id: BigNumber,
            to: string[],
            quantities: BigNumber[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('id', id);
            assert.isArray('to', to);
            assert.isArray('quantities', quantities);
            const self = (this as any) as ERC1155MintableContract;
            const txHashPromise = self.mintFungible.sendTransactionAsync(id, to, quantities, txData);
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
         * @param id token type
         * @param to beneficiaries of minted tokens
         * @param quantities amounts of minted tokens
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            id: BigNumber,
            to: string[],
            quantities: BigNumber[],
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBigNumber('id', id);
            assert.isArray('to', to);
            assert.isArray('quantities', quantities);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('mintFungible(uint256,address[],uint256[])', [
                id,
                to,
                quantities,
            ]);
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
            to: string[],
            quantities: BigNumber[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).mintFungible.callAsync(id, to, quantities, txData);
            const txHash = await (this as any).mintFungible.sendTransactionAsync(id, to, quantities, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param id token type
         * @param to beneficiaries of minted tokens
         * @param quantities amounts of minted tokens
         */
        async callAsync(
            id: BigNumber,
            to: string[],
            quantities: BigNumber[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('id', id);
            assert.isArray('to', to);
            assert.isArray('quantities', quantities);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('mintFungible(uint256,address[],uint256[])', [
                id,
                to,
                quantities,
            ]);
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
            const abiEncoder = self._lookupAbiEncoder('mintFungible(uint256,address[],uint256[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param id token type
         * @param to beneficiaries of minted tokens
         * @param quantities amounts of minted tokens
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(id: BigNumber, to: string[], quantities: BigNumber[]): string {
            assert.isBigNumber('id', id);
            assert.isArray('to', to);
            assert.isArray('quantities', quantities);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('mintFungible(uint256,address[],uint256[])', [
                id,
                to,
                quantities,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [BigNumber, string[], BigNumber[]] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('mintFungible(uint256,address[],uint256[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber, string[], BigNumber[]]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('mintFungible(uint256,address[],uint256[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * mints a non-fungible token
     */
    public mintNonFungible = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param type_ token type
         * @param to beneficiaries of minted tokens
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            type_: BigNumber,
            to: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('type_', type_);
            assert.isArray('to', to);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('mintNonFungible(uint256,address[])', [type_, to]);
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
         * @param type_ token type
         * @param to beneficiaries of minted tokens
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            type_: BigNumber,
            to: string[],
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('type_', type_);
            assert.isArray('to', to);
            const self = (this as any) as ERC1155MintableContract;
            const txHashPromise = self.mintNonFungible.sendTransactionAsync(type_, to, txData);
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
         * @param type_ token type
         * @param to beneficiaries of minted tokens
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(type_: BigNumber, to: string[], txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('type_', type_);
            assert.isArray('to', to);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('mintNonFungible(uint256,address[])', [type_, to]);
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
            type_: BigNumber,
            to: string[],
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).mintNonFungible.callAsync(type_, to, txData);
            const txHash = await (this as any).mintNonFungible.sendTransactionAsync(type_, to, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param type_ token type
         * @param to beneficiaries of minted tokens
         */
        async callAsync(
            type_: BigNumber,
            to: string[],
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('type_', type_);
            assert.isArray('to', to);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('mintNonFungible(uint256,address[])', [type_, to]);
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
            const abiEncoder = self._lookupAbiEncoder('mintNonFungible(uint256,address[])');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param type_ token type
         * @param to beneficiaries of minted tokens
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(type_: BigNumber, to: string[]): string {
            assert.isBigNumber('type_', type_);
            assert.isArray('to', to);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('mintNonFungible(uint256,address[])', [
                type_,
                to,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [BigNumber, string[]] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('mintNonFungible(uint256,address[])');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[BigNumber, string[]]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('mintNonFungible(uint256,address[])');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * returns owner of a non-fungible token
     */
    public ownerOf = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(id: BigNumber, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string> {
            assert.isBigNumber('id', id);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('ownerOf(uint256)', [id]);
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
            const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
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
        getABIEncodedTransactionData(id: BigNumber): string {
            assert.isBigNumber('id', id);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('ownerOf(uint256)', [id]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): BigNumber {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<BigNumber>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): string {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('ownerOf(uint256)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<string>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * MUST emit TransferBatch event on success. Caller must be approved to manage the _from account's tokens (see isApprovedForAll). MUST throw if `_to` is the zero address. MUST throw if length of `_ids` is not the same as length of `_values`.  MUST throw if any of the balance of sender for token `_ids` is lower than the respective `_values` sent. MUST throw on any other error. When transfer is complete, this function MUST check if `_to` is a smart contract (code size > 0). If so, it MUST call `onERC1155BatchReceived` on `_to` and revert if the return value is not `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`.
     */
    public safeBatchTransferFrom = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param from Source addresses
         * @param to Target addresses
         * @param ids IDs of each token type
         * @param values Transfer amounts per token type
         * @param data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            from: string,
            to: string,
            ids: BigNumber[],
            values: BigNumber[],
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isArray('ids', ids);
            assert.isArray('values', values);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments(
                'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
                [from.toLowerCase(), to.toLowerCase(), ids, values, data],
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
         * @param from Source addresses
         * @param to Target addresses
         * @param ids IDs of each token type
         * @param values Transfer amounts per token type
         * @param data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            from: string,
            to: string,
            ids: BigNumber[],
            values: BigNumber[],
            data: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isArray('ids', ids);
            assert.isArray('values', values);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const txHashPromise = self.safeBatchTransferFrom.sendTransactionAsync(
                from.toLowerCase(),
                to.toLowerCase(),
                ids,
                values,
                data,
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
         * @param from Source addresses
         * @param to Target addresses
         * @param ids IDs of each token type
         * @param values Transfer amounts per token type
         * @param data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            from: string,
            to: string,
            ids: BigNumber[],
            values: BigNumber[],
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isArray('ids', ids);
            assert.isArray('values', values);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments(
                'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
                [from.toLowerCase(), to.toLowerCase(), ids, values, data],
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
            from: string,
            to: string,
            ids: BigNumber[],
            values: BigNumber[],
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).safeBatchTransferFrom.callAsync(from, to, ids, values, data, txData);
            const txHash = await (this as any).safeBatchTransferFrom.sendTransactionAsync(
                from,
                to,
                ids,
                values,
                data,
                txData,
            );
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param from Source addresses
         * @param to Target addresses
         * @param ids IDs of each token type
         * @param values Transfer amounts per token type
         * @param data Additional data with no specified format, sent in call to `_to`
         */
        async callAsync(
            from: string,
            to: string,
            ids: BigNumber[],
            values: BigNumber[],
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isArray('ids', ids);
            assert.isArray('values', values);
            assert.isString('data', data);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments(
                'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
                [from.toLowerCase(), to.toLowerCase(), ids, values, data],
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
                'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
            );
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param from Source addresses
         * @param to Target addresses
         * @param ids IDs of each token type
         * @param values Transfer amounts per token type
         * @param data Additional data with no specified format, sent in call to `_to`
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            from: string,
            to: string,
            ids: BigNumber[],
            values: BigNumber[],
            data: string,
        ): string {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isArray('ids', ids);
            assert.isArray('values', values);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
                [from.toLowerCase(), to.toLowerCase(), ids, values, data],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, string, BigNumber[], BigNumber[], string] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder(
                'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string, BigNumber[], BigNumber[], string]>(
                callData,
            );
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder(
                'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
            );
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * MUST emit TransferSingle event on success. Caller must be approved to manage the _from account's tokens (see isApprovedForAll). MUST throw if `_to` is the zero address. MUST throw if balance of sender for token `_id` is lower than the `_value` sent. MUST throw on any other error. When transfer is complete, this function MUST check if `_to` is a smart contract (code size > 0). If so, it MUST call `onERC1155Received` on `_to` and revert if the return value is not `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`.
     */
    public safeTransferFrom = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param from Source address
         * @param to Target address
         * @param id ID of the token type
         * @param value Transfer amount
         * @param data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            from: string,
            to: string,
            id: BigNumber,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('id', id);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,uint256,bytes)', [
                from.toLowerCase(),
                to.toLowerCase(),
                id,
                value,
                data,
            ]);
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
         * @param from Source address
         * @param to Target address
         * @param id ID of the token type
         * @param value Transfer amount
         * @param data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            from: string,
            to: string,
            id: BigNumber,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('id', id);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const txHashPromise = self.safeTransferFrom.sendTransactionAsync(
                from.toLowerCase(),
                to.toLowerCase(),
                id,
                value,
                data,
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
         * @param from Source address
         * @param to Target address
         * @param id ID of the token type
         * @param value Transfer amount
         * @param data Additional data with no specified format, sent in call to `_to`
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            from: string,
            to: string,
            id: BigNumber,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('id', id);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,uint256,bytes)', [
                from.toLowerCase(),
                to.toLowerCase(),
                id,
                value,
                data,
            ]);
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
            from: string,
            to: string,
            id: BigNumber,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).safeTransferFrom.callAsync(from, to, id, value, data, txData);
            const txHash = await (this as any).safeTransferFrom.sendTransactionAsync(from, to, id, value, data, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param from Source address
         * @param to Target address
         * @param id ID of the token type
         * @param value Transfer amount
         * @param data Additional data with no specified format, sent in call to `_to`
         */
        async callAsync(
            from: string,
            to: string,
            id: BigNumber,
            value: BigNumber,
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('id', id);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('safeTransferFrom(address,address,uint256,uint256,bytes)', [
                from.toLowerCase(),
                to.toLowerCase(),
                id,
                value,
                data,
            ]);
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
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,uint256,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param from Source address
         * @param to Target address
         * @param id ID of the token type
         * @param value Transfer amount
         * @param data Additional data with no specified format, sent in call to `_to`
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(from: string, to: string, id: BigNumber, value: BigNumber, data: string): string {
            assert.isString('from', from);
            assert.isString('to', to);
            assert.isBigNumber('id', id);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'safeTransferFrom(address,address,uint256,uint256,bytes)',
                [from.toLowerCase(), to.toLowerCase(), id, value, data],
            );
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, string, BigNumber, BigNumber, string] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, string, BigNumber, BigNumber, string]>(
                callData,
            );
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('safeTransferFrom(address,address,uint256,uint256,bytes)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    /**
     * MUST emit the ApprovalForAll event on success.
     */
    public setApprovalForAll = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param operator Address to add to the set of authorized operators
         * @param approved True if the operator is approved, false to revoke approval
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            operator: string,
            approved: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('operator', operator);
            assert.isBoolean('approved', approved);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                operator.toLowerCase(),
                approved,
            ]);
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
         * @param operator Address to add to the set of authorized operators
         * @param approved True if the operator is approved, false to revoke approval
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            operator: string,
            approved: boolean,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('operator', operator);
            assert.isBoolean('approved', approved);
            const self = (this as any) as ERC1155MintableContract;
            const txHashPromise = self.setApprovalForAll.sendTransactionAsync(operator.toLowerCase(), approved, txData);
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
         * @param operator Address to add to the set of authorized operators
         * @param approved True if the operator is approved, false to revoke approval
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            operator: string,
            approved: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('operator', operator);
            assert.isBoolean('approved', approved);
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                operator.toLowerCase(),
                approved,
            ]);
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
            operator: string,
            approved: boolean,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).setApprovalForAll.callAsync(operator, approved, txData);
            const txHash = await (this as any).setApprovalForAll.sendTransactionAsync(operator, approved, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param operator Address to add to the set of authorized operators
         * @param approved True if the operator is approved, false to revoke approval
         */
        async callAsync(
            operator: string,
            approved: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('operator', operator);
            assert.isBoolean('approved', approved);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as ERC1155MintableContract;
            const encodedData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                operator.toLowerCase(),
                approved,
            ]);
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
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param operator Address to add to the set of authorized operators
         * @param approved True if the operator is approved, false to revoke approval
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(operator: string, approved: boolean): string {
            assert.isString('operator', operator);
            assert.isBoolean('approved', approved);
            const self = (this as any) as ERC1155MintableContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('setApprovalForAll(address,bool)', [
                operator.toLowerCase(),
                approved,
            ]);
            return abiEncodedTransactionData;
        },
        /**
         * Decode the ABI-encoded transaction data into its input arguments
         * @param callData The ABI-encoded transaction data
         * @returns An array representing the input arguments in order. Keynames of nested structs are preserved.
         */
        getABIDecodedTransactionData(callData: string): [string, boolean] {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedCallData = abiEncoder.strictDecode<[string, boolean]>(callData);
            return abiDecodedCallData;
        },
        /**
         * Decode the ABI-encoded return data from a transaction
         * @param returnData the data returned after transaction execution
         * @returns An array representing the output results in order.  Keynames of nested structs are preserved.
         */
        getABIDecodedReturnData(returnData: string): void {
            const self = (this as any) as ERC1155MintableContract;
            const abiEncoder = self._lookupAbiEncoder('setApprovalForAll(address,bool)');
            // tslint:disable boolean-naming
            const abiDecodedReturnData = abiEncoder.strictDecodeReturnValue<void>(returnData);
            return abiDecodedReturnData;
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<ERC1155MintableEventArgs, ERC1155MintableEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
    ): Promise<ERC1155MintableContract> {
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
        return ERC1155MintableContract.deployAsync(bytecode, abi, provider, txDefaults, logDecodeDependenciesAbiOnly);
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
    ): Promise<ERC1155MintableContract> {
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
        logUtils.log(`ERC1155Mintable successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new ERC1155MintableContract(
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
                        name: 'owner',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'operator',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'approved',
                        type: 'bool',
                        indexed: false,
                    },
                ],
                name: 'ApprovalForAll',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'operator',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'from',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'to',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'ids',
                        type: 'uint256[]',
                        indexed: false,
                    },
                    {
                        name: 'values',
                        type: 'uint256[]',
                        indexed: false,
                    },
                ],
                name: 'TransferBatch',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'operator',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'from',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'to',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'id',
                        type: 'uint256',
                        indexed: false,
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'TransferSingle',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'value',
                        type: 'string',
                        indexed: false,
                    },
                    {
                        name: 'id',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'URI',
                outputs: [],
                type: 'event',
            },
            {
                constant: true,
                inputs: [],
                name: 'ERC1155_BATCH_RECEIVED',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'ERC1155_RECEIVED',
                outputs: [
                    {
                        name: '',
                        type: 'bytes4',
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
                        name: 'owner',
                        type: 'address',
                    },
                    {
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'balanceOf',
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
                        name: 'owners',
                        type: 'address[]',
                    },
                    {
                        name: 'ids',
                        type: 'uint256[]',
                    },
                ],
                name: 'balanceOfBatch',
                outputs: [
                    {
                        name: 'balances_',
                        type: 'uint256[]',
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
                        name: 'uri',
                        type: 'string',
                    },
                    {
                        name: 'isNF',
                        type: 'bool',
                    },
                ],
                name: 'create',
                outputs: [
                    {
                        name: 'type_',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'type_',
                        type: 'uint256',
                    },
                    {
                        name: 'uri',
                        type: 'string',
                    },
                ],
                name: 'createWithType',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
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
                name: 'creators',
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
                constant: true,
                inputs: [
                    {
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'getNonFungibleBaseType',
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
                inputs: [
                    {
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'getNonFungibleIndex',
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
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                    },
                    {
                        name: 'operator',
                        type: 'address',
                    },
                ],
                name: 'isApprovedForAll',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
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
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'isFungible',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
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
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'isNonFungible',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
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
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'isNonFungibleBaseType',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
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
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'isNonFungibleItem',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
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
                ],
                name: 'maxIndex',
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
                constant: false,
                inputs: [
                    {
                        name: 'id',
                        type: 'uint256',
                    },
                    {
                        name: 'to',
                        type: 'address[]',
                    },
                    {
                        name: 'quantities',
                        type: 'uint256[]',
                    },
                ],
                name: 'mintFungible',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'type_',
                        type: 'uint256',
                    },
                    {
                        name: 'to',
                        type: 'address[]',
                    },
                ],
                name: 'mintNonFungible',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: 'id',
                        type: 'uint256',
                    },
                ],
                name: 'ownerOf',
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
                        name: 'from',
                        type: 'address',
                    },
                    {
                        name: 'to',
                        type: 'address',
                    },
                    {
                        name: 'ids',
                        type: 'uint256[]',
                    },
                    {
                        name: 'values',
                        type: 'uint256[]',
                    },
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                ],
                name: 'safeBatchTransferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'from',
                        type: 'address',
                    },
                    {
                        name: 'to',
                        type: 'address',
                    },
                    {
                        name: 'id',
                        type: 'uint256',
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                    },
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                ],
                name: 'safeTransferFrom',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'operator',
                        type: 'address',
                    },
                    {
                        name: 'approved',
                        type: 'bool',
                    },
                ],
                name: 'setApprovalForAll',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the ERC1155Mintable contract.
     * @param eventName The ERC1155Mintable contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ERC1155MintableEventArgs>(
        eventName: ERC1155MintableEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ERC1155MintableEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            ERC1155MintableContract.ABI(),
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
     * @param eventName The ERC1155Mintable contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ERC1155MintableEventArgs>(
        eventName: ERC1155MintableEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ERC1155MintableEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            ERC1155MintableContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = ERC1155MintableContract.deployedBytecode,
    ) {
        super(
            'ERC1155Mintable',
            ERC1155MintableContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<ERC1155MintableEventArgs, ERC1155MintableEvents>(
            ERC1155MintableContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
