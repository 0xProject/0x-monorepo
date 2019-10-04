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

export type AssetProxyOwnerEventArgs =
    | AssetProxyOwnerConfirmationEventArgs
    | AssetProxyOwnerConfirmationTimeSetEventArgs
    | AssetProxyOwnerDepositEventArgs
    | AssetProxyOwnerExecutionEventArgs
    | AssetProxyOwnerExecutionFailureEventArgs
    | AssetProxyOwnerFunctionCallTimeLockRegistrationEventArgs
    | AssetProxyOwnerOwnerAdditionEventArgs
    | AssetProxyOwnerOwnerRemovalEventArgs
    | AssetProxyOwnerRequirementChangeEventArgs
    | AssetProxyOwnerRevocationEventArgs
    | AssetProxyOwnerSubmissionEventArgs
    | AssetProxyOwnerTimeLockChangeEventArgs;

export enum AssetProxyOwnerEvents {
    Confirmation = 'Confirmation',
    ConfirmationTimeSet = 'ConfirmationTimeSet',
    Deposit = 'Deposit',
    Execution = 'Execution',
    ExecutionFailure = 'ExecutionFailure',
    FunctionCallTimeLockRegistration = 'FunctionCallTimeLockRegistration',
    OwnerAddition = 'OwnerAddition',
    OwnerRemoval = 'OwnerRemoval',
    RequirementChange = 'RequirementChange',
    Revocation = 'Revocation',
    Submission = 'Submission',
    TimeLockChange = 'TimeLockChange',
}

export interface AssetProxyOwnerConfirmationEventArgs extends DecodedLogArgs {
    sender: string;
    transactionId: BigNumber;
}

export interface AssetProxyOwnerConfirmationTimeSetEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
    confirmationTime: BigNumber;
}

export interface AssetProxyOwnerDepositEventArgs extends DecodedLogArgs {
    sender: string;
    value: BigNumber;
}

export interface AssetProxyOwnerExecutionEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
}

export interface AssetProxyOwnerExecutionFailureEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
}

export interface AssetProxyOwnerFunctionCallTimeLockRegistrationEventArgs extends DecodedLogArgs {
    functionSelector: string;
    destination: string;
    hasCustomTimeLock: boolean;
    newSecondsTimeLocked: BigNumber;
}

export interface AssetProxyOwnerOwnerAdditionEventArgs extends DecodedLogArgs {
    owner: string;
}

export interface AssetProxyOwnerOwnerRemovalEventArgs extends DecodedLogArgs {
    owner: string;
}

export interface AssetProxyOwnerRequirementChangeEventArgs extends DecodedLogArgs {
    required: BigNumber;
}

export interface AssetProxyOwnerRevocationEventArgs extends DecodedLogArgs {
    sender: string;
    transactionId: BigNumber;
}

export interface AssetProxyOwnerSubmissionEventArgs extends DecodedLogArgs {
    transactionId: BigNumber;
}

export interface AssetProxyOwnerTimeLockChangeEventArgs extends DecodedLogArgs {
    secondsTimeLocked: BigNumber;
}

/* istanbul ignore next */
// tslint:disable:no-parameter-reassignment
// tslint:disable-next-line:class-name
export class AssetProxyOwnerContract extends BaseContract {
    /**
     * @ignore
     */
    public static deployedBytecode =
        '0x6080604052600436106101a15760003560e01c80639ace38c2116100e1578063c01a8c841161008a578063d74f8edd11610064578063d74f8edd146104ff578063dc8452cd14610514578063e20056e614610529578063ee22610b14610549576101a1565b8063c01a8c841461049f578063c6427474146104bf578063d38f2d82146104df576101a1565b8063b5dc40c3116100bb578063b5dc40c31461044a578063b77bf6001461046a578063ba51a6df1461047f576101a1565b80639ace38c2146103cb578063a0e67e2b146103fb578063a8abe69a1461041d576101a1565b8063547415251161014e578063784547a711610128578063784547a71461033d5780637ad28c511461035d5780637f05c8b61461037d5780638b51d13f146103ab576101a1565b806354741525146102dd5780637065cb48146102fd578063751ad5601461031d576101a1565b80632f54bf6e1161017f5780632f54bf6e1461026e5780633411c81c1461029b57806337bd78a0146102bb576101a1565b8063025e7c27146101f8578063173825d91461022e57806320ea8d861461024e575b34156101f6573373ffffffffffffffffffffffffffffffffffffffff167fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c346040516101ed9190612b44565b60405180910390a25b005b34801561020457600080fd5b50610218610213366004612580565b610569565b6040516102259190612616565b60405180910390f35b34801561023a57600080fd5b506101f6610249366004612303565b61059d565b34801561025a57600080fd5b506101f6610269366004612580565b61084c565b34801561027a57600080fd5b5061028e610289366004612303565b6109a7565b6040516102259190612745565b3480156102a757600080fd5b5061028e6102b6366004612598565b6109bc565b3480156102c757600080fd5b506102d06109dc565b6040516102259190612b44565b3480156102e957600080fd5b506102d06102f83660046124c0565b6109e2565b34801561030957600080fd5b506101f6610318366004612303565b610a4e565b34801561032957600080fd5b506101f66103383660046124f4565b610c73565b34801561034957600080fd5b5061028e610358366004612580565b610cbe565b34801561036957600080fd5b506101f6610378366004612580565b610d52565b34801561038957600080fd5b5061039d610398366004612563565b610dcb565b604051610225929190612750565b3480156103b757600080fd5b506102d06103c6366004612580565b610e04565b3480156103d757600080fd5b506103eb6103e6366004612580565b610e80565b6040516102259493929190612637565b34801561040757600080fd5b50610410610f69565b60405161022591906126b4565b34801561042957600080fd5b5061043d6104383660046125bc565b610fd9565b604051610225919061270d565b34801561045657600080fd5b50610410610465366004612580565b611104565b34801561047657600080fd5b506102d06112bc565b34801561048b57600080fd5b506101f661049a366004612580565b6112c2565b3480156104ab57600080fd5b506101f66104ba366004612580565b61139e565b3480156104cb57600080fd5b506102d06104da366004612357565b611568565b3480156104eb57600080fd5b506102d06104fa366004612580565b611587565b34801561050b57600080fd5b506102d0611599565b34801561052057600080fd5b506102d061159e565b34801561053557600080fd5b506101f661054436600461231f565b6115a4565b34801561055557600080fd5b506101f6610564366004612580565b61182e565b6003818154811061057657fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff16905081565b3330146105df576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a68565b60405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff8116600090815260026020526040902054819060ff16610640576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d6906129fa565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260026020526040812080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001690555b6003547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff018110156107bc578273ffffffffffffffffffffffffffffffffffffffff16600382815481106106dc57fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff1614156107b457600380547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff810190811061073457fe5b6000918252602090912001546003805473ffffffffffffffffffffffffffffffffffffffff909216918390811061076757fe5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506107bc565b60010161068c565b50600380547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01906107ee9082612100565b50600354600454111561080757600354610807906112c2565b60405173ffffffffffffffffffffffffffffffffffffffff8316907f8001553a916ef2f495d26a907cc54d96ed840d7bda71e73194bf5a9df7a76b9090600090a25050565b3360008181526002602052604090205460ff16610895576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d6906129fa565b60008281526001602090815260408083203380855292529091205483919060ff166108ec576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612955565b600084815260208190526040902060030154849060ff161561093a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612ad6565b600085815260016020908152604080832033808552925280832080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001690555187927ff6a317157440607f36269043eb55f1287a5a19ba2216afeab88cd46cbcfb88e991a35050505050565b60026020526000908152604090205460ff1681565b600160209081526000928352604080842090915290825290205460ff1681565b60065481565b6000805b600554811015610a4757838015610a0f575060008181526020819052604090206003015460ff16155b80610a335750828015610a33575060008181526020819052604090206003015460ff165b15610a3f576001820191505b6001016109e6565b5092915050565b333014610a87576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a68565b73ffffffffffffffffffffffffffffffffffffffff8116600090815260026020526040902054819060ff1615610ae9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612879565b8173ffffffffffffffffffffffffffffffffffffffff8116610b37576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d69061280b565b60038054905060010160045460328211158015610b545750818111155b8015610b5f57508015155b8015610b6a57508115155b610ba0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612b0d565b73ffffffffffffffffffffffffffffffffffffffff851660008181526002602052604080822080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0016600190811790915560038054918201815583527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b0180547fffffffffffffffffffffffff00000000000000000000000000000000000000001684179055517ff39e6e1eb0edcf53c221607b54b00cd28f3196fed0a24994dc308b8f611b682d9190a25050505050565b333014610cac576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a68565b610cb884848484611b79565b50505050565b600080805b600354811015610d4a5760008481526001602052604081206003805491929184908110610cec57fe5b600091825260208083209091015473ffffffffffffffffffffffffffffffffffffffff16835282019290925260400190205460ff1615610d2d576001820191505b600454821415610d4257600192505050610d4d565b600101610cc3565b50505b919050565b333014610d8b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a68565b60068190556040517fd1c9101a34feff75cccef14a28785a0279cb0b49c1f321f21f5f422e746b437790610dc0908390612b44565b60405180910390a150565b600860209081526000928352604080842090915290825290205460ff81169061010090046fffffffffffffffffffffffffffffffff1682565b6000805b600354811015610e7a5760008381526001602052604081206003805491929184908110610e3157fe5b600091825260208083209091015473ffffffffffffffffffffffffffffffffffffffff16835282019290925260400190205460ff1615610e72576001820191505b600101610e08565b50919050565b60006020818152918152604090819020805460018083015460028085018054875161010095821615959095027fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff011691909104601f810188900488028401880190965285835273ffffffffffffffffffffffffffffffffffffffff90931695909491929190830182828015610f565780601f10610f2b57610100808354040283529160200191610f56565b820191906000526020600020905b815481529060010190602001808311610f3957829003601f168201915b5050506003909301549192505060ff1684565b60606003805480602002602001604051908101604052809291908181526020018280548015610fce57602002820191906000526020600020905b815473ffffffffffffffffffffffffffffffffffffffff168152600190910190602001808311610fa3575b505050505090505b90565b606080600554604051908082528060200260200182016040528015611008578160200160208202803883390190505b5090506000805b60055481101561108957858015611038575060008181526020819052604090206003015460ff16155b8061105c575084801561105c575060008181526020819052604090206003015460ff165b15611081578083838151811061106e57fe5b6020026020010181815250506001820191505b60010161100f565b8787036040519080825280602002602001820160405280156110b5578160200160208202803883390190505b5093508790505b868110156110f9578281815181106110d057fe5b602002602001015184898303815181106110e657fe5b60209081029190910101526001016110bc565b505050949350505050565b606080600380549050604051908082528060200260200182016040528015611136578160200160208202803883390190505b5090506000805b60035481101561122d576000858152600160205260408120600380549192918490811061116657fe5b600091825260208083209091015473ffffffffffffffffffffffffffffffffffffffff16835282019290925260400190205460ff161561122557600381815481106111ad57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168383815181106111e457fe5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250506001820191505b60010161113d565b81604051908082528060200260200182016040528015611257578160200160208202803883390190505b509350600090505b818110156112b45782818151811061127357fe5b602002602001015184828151811061128757fe5b73ffffffffffffffffffffffffffffffffffffffff9092166020928302919091019091015260010161125f565b505050919050565b60055481565b3330146112fb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a68565b60035481603282118015906113105750818111155b801561131b57508015155b801561132657508115155b61135c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612b0d565b60048390556040517fa3f1ee9126a074d9326c682f561767f710e927faa811f7a99829d49dc421797a90611391908590612b44565b60405180910390a1505050565b3360008181526002602052604090205460ff166113e7576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d6906129fa565b600082815260208190526040902054829073ffffffffffffffffffffffffffffffffffffffff16611444576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d69061291e565b60008381526001602090815260408083203380855292529091205484919060ff161561149c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d6906128b0565b846114a681610cbe565b156114dd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a9f565b600086815260016020818152604080842033808652925280842080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0016909317909255905188927f4a504a94899432a9846e1aa406dceb1bcfd538bb839071d49d1e5e23f5be30ef91a361155186610cbe565b15611560576115608642611cb1565b505050505050565b6000611575848484611d00565b90506115808161139e565b9392505050565b60076020526000908152604090205481565b603281565b60045481565b3330146115dd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a68565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260026020526040902054829060ff1661163e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d6906129fa565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260026020526040902054829060ff16156116a0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612879565b60005b60035481101561175c578473ffffffffffffffffffffffffffffffffffffffff16600382815481106116d157fe5b60009182526020909120015473ffffffffffffffffffffffffffffffffffffffff16141561175457836003828154811061170757fe5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061175c565b6001016116a3565b5073ffffffffffffffffffffffffffffffffffffffff80851660008181526002602052604080822080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0090811690915593871682528082208054909416600117909355915190917f8001553a916ef2f495d26a907cc54d96ed840d7bda71e73194bf5a9df7a76b9091a260405173ffffffffffffffffffffffffffffffffffffffff8416907ff39e6e1eb0edcf53c221607b54b00cd28f3196fed0a24994dc308b8f611b682d90600090a250505050565b600081815260208190526040902060030154819060ff161561187c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612ad6565b8161188681610cbe565b6118bc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d6906128e7565b6000838152602081815260409182902060038101805460017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00909116811790915560028083018054865161010094821615949094027fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff011691909104601f81018590048502830185019095528482529193606093849384939290918301828280156119a85780601f1061197d576101008083540402835291602001916119a8565b820191906000526020600020905b81548152906001019060200180831161198b57829003601f168201915b50505050508060200190516119c091908101906123ec565b9250925092506000835190508251811480156119dc5750815181145b611a12576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d69061298c565b600088815260076020526040812054905b828114611b4257611a5b82878381518110611a3a57fe5b6020026020010151878481518110611a4e57fe5b6020026020010151611e5e565b6000858281518110611a6957fe5b602002602001015173ffffffffffffffffffffffffffffffffffffffff16858381518110611a9357fe5b6020026020010151888481518110611aa757fe5b6020026020010151604051611abc91906125fa565b60006040518083038185875af1925050503d8060008114611af9576040519150601f19603f3d011682016040523d82523d6000602084013e611afe565b606091505b5050905080611b39576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d6906129c3565b50600101611a23565b5060405189907f33e13ecb54c3076d8e8bb8c2881800a4d972b792045ffae98fdf46df365fed7590600090a2505050505050505050565b600084611b87576000611b89565b815b9050611b93612129565b5060408051808201825286151581526fffffffffffffffffffffffffffffffff80841660208084019182527fffffffff00000000000000000000000000000000000000000000000000000000891660009081526008825285812073ffffffffffffffffffffffffffffffffffffffff8a168252909152849020835181549251909316610100027fffffffffffffffffffffffffffffff00000000000000000000000000000000ff9315157fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00909316929092179290921617905590517f694405724de467488eda192d814f39ffe7f6503fe0b1eefd4ea332f9c611c5ec90611ca190879087908a908790612772565b60405180910390a1505050505050565b600082815260076020526040908190208290555182907f0b237afe65f1514fd7ea3f923ea4fe792bdd07000a912b6cd1602a8e7f573c8d90611cf4908490612b44565b60405180910390a25050565b60008373ffffffffffffffffffffffffffffffffffffffff8116611d50576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d69061280b565b6005546040805160808101825273ffffffffffffffffffffffffffffffffffffffff8881168252602080830189815283850189815260006060860181905287815280845295909520845181547fffffffffffffffffffffffff00000000000000000000000000000000000000001694169390931783555160018301559251805194965091939092611de8926002850192910190612140565b5060609190910151600390910180547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001691151591909117905560058054600101905560405182907fc0ba8fe4b176c1714197d43b9cc6bcf797a4a7461c5fe8d0ef6e184ae7601e5190600090a2509392505050565b6000611e70838263ffffffff611fbd16565b9050611e7a612129565b507fffffffff000000000000000000000000000000000000000000000000000000008116600090815260086020908152604080832073ffffffffffffffffffffffffffffffffffffffff8616845282529182902082518084019093525460ff811615801584526101009091046fffffffffffffffffffffffffffffffff1691830191909152611f69576020810151611f2b9086906fffffffffffffffffffffffffffffffff1663ffffffff61201816565b421015611f64576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612a31565b611fb6565b600654611f7d90869063ffffffff61201816565b421015611fb6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105d690612842565b5050505050565b60008160040183511015611fe357611fe3611fde6003855185600401612034565b6120d9565b5060208183018101519101907fffffffff00000000000000000000000000000000000000000000000000000000165b92915050565b60008282018381101561158057611580611fde600086866120e1565b6060632800659560e01b848484604051602401612053939291906127fd565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915290509392505050565b805160208201fd5b606063e946c1bb60e01b848484604051602401612053939291906127db565b815481835581811115612124576000838152602090206121249181019083016121be565b505050565b604080518082019091526000808252602082015290565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061218157805160ff19168380011785556121ae565b828001600101855582156121ae579182015b828111156121ae578251825591602001919060010190612193565b506121ba9291506121be565b5090565b610fd691905b808211156121ba57600081556001016121c4565b600082601f8301126121e8578081fd5b81516121fb6121f682612b74565b612b4d565b81815291506020808301908481018184028601820187101561221c57600080fd5b60005b8481101561224457815161223281612c02565b8452928201929082019060010161221f565b505050505092915050565b600082601f83011261225f578081fd5b815161226d6121f682612b74565b81815291506020808301908481018184028601820187101561228e57600080fd5b60005b8481101561224457815184529282019290820190600101612291565b8035801515811461201257600080fd5b600082601f8301126122cd578081fd5b81516122db6121f682612b94565b91508082528360208285010111156122f257600080fd5b610a47816020840160208601612bd6565b600060208284031215612314578081fd5b813561158081612c02565b60008060408385031215612331578081fd5b823561233c81612c02565b9150602083013561234c81612c02565b809150509250929050565b60008060006060848603121561236b578081fd5b833561237681612c02565b925060208401359150604084013567ffffffffffffffff811115612398578182fd5b80850186601f8201126123a9578283fd5b803591506123b96121f683612b94565b8281528760208484010111156123cd578384fd5b8260208301602083013783602084830101528093505050509250925092565b600080600060608486031215612400578283fd5b835167ffffffffffffffff80821115612417578485fd5b81860187601f820112612428578586fd5b805192506124386121f684612b74565b83815260208082019190838101895b878110156124705761245e8d8484518901016122bd565b85529382019390820190600101612447565b50508901519097509350505080821115612488578384fd5b612494878388016121d8565b935060408601519150808211156124a9578283fd5b506124b68682870161224f565b9150509250925092565b600080604083850312156124d2578182fd5b6124dc84846122ad565b91506124eb84602085016122ad565b90509250929050565b60008060008060808587031215612509578081fd5b843561251481612c27565b9350602085013561252481612c35565b9250604085013561253481612c02565b915060608501356fffffffffffffffffffffffffffffffff81168114612558578182fd5b939692955090935050565b60008060408385031215612575578182fd5b823561233c81612c35565b600060208284031215612591578081fd5b5035919050565b600080604083850312156125aa578182fd5b82359150602083013561234c81612c02565b600080600080608085870312156125d1578182fd5b843593506020850135925060408501356125ea81612c27565b9150606085013561255881612c27565b6000825161260c818460208701612bd6565b9190910192915050565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b600073ffffffffffffffffffffffffffffffffffffffff861682528460208301526080604083015283518060808401526126788160a0850160208801612bd6565b921515606083015250601f919091017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0160160a0019392505050565b602080825282518282018190526000918401906040840190835b8181101561270257835173ffffffffffffffffffffffffffffffffffffffff168352602093840193909201916001016126ce565b509095945050505050565b602080825282518282018190526000918401906040840190835b81811015612702578351835260209384019390920191600101612727565b901515815260200190565b91151582526fffffffffffffffffffffffffffffffff16602082015260400190565b7fffffffff0000000000000000000000000000000000000000000000000000000094909416845273ffffffffffffffffffffffffffffffffffffffff929092166020840152151560408301526fffffffffffffffffffffffffffffffff16606082015260800190565b60608101600485106127e957fe5b938152602081019290925260409091015290565b60608101600885106127e957fe5b6020808252600c908201527f4e554c4c5f414444524553530000000000000000000000000000000000000000604082015260600190565b6020808252601c908201527f44454641554c545f54494d455f4c4f434b5f494e434f4d504c45544500000000604082015260600190565b6020808252600c908201527f4f574e45525f4558495354530000000000000000000000000000000000000000604082015260600190565b60208082526014908201527f54585f414c52454144595f434f4e4649524d4544000000000000000000000000604082015260600190565b60208082526016908201527f54585f4e4f545f46554c4c595f434f4e4649524d454400000000000000000000604082015260600190565b6020808252600f908201527f54585f444f45534e545f45584953540000000000000000000000000000000000604082015260600190565b60208082526010908201527f54585f4e4f545f434f4e4649524d454400000000000000000000000000000000604082015260600190565b60208082526016908201527f455155414c5f4c454e475448535f524551554952454400000000000000000000604082015260600190565b60208082526010908201527f4641494c45445f455845435554494f4e00000000000000000000000000000000604082015260600190565b60208082526012908201527f4f574e45525f444f45534e545f45584953540000000000000000000000000000604082015260600190565b6020808252601b908201527f435553544f4d5f54494d455f4c4f434b5f494e434f4d504c4554450000000000604082015260600190565b60208082526017908201527f4f4e4c595f43414c4c41424c455f42595f57414c4c4554000000000000000000604082015260600190565b60208082526012908201527f54585f46554c4c595f434f4e4649524d45440000000000000000000000000000604082015260600190565b60208082526013908201527f54585f414c52454144595f455845435554454400000000000000000000000000604082015260600190565b60208082526014908201527f494e56414c49445f524551554952454d454e5453000000000000000000000000604082015260600190565b90815260200190565b60405181810167ffffffffffffffff81118282101715612b6c57600080fd5b604052919050565b600067ffffffffffffffff821115612b8a578081fd5b5060209081020190565b600067ffffffffffffffff821115612baa578081fd5b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01660200190565b60005b83811015612bf1578181015183820152602001612bd9565b83811115610cb85750506000910152565b73ffffffffffffffffffffffffffffffffffffffff81168114612c2457600080fd5b50565b8015158114612c2457600080fd5b7fffffffff0000000000000000000000000000000000000000000000000000000081168114612c2457600080fdfea365627a7a723158200ac5186607cd3ec8212bb7bd34d7047a94bed6fb931222d7ea453055d00701cd6c6578706572696d656e74616cf564736f6c634300050c0040';
    public MAX_OWNER_COUNT = {
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('MAX_OWNER_COUNT()', []);
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
            const abiEncoder = self._lookupAbiEncoder('MAX_OWNER_COUNT()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Allows to add a new owner. Transaction has to be sent by wallet.
     */
    public addOwner = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param owner Address of new owner.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
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
         * @param owner Address of new owner.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.addOwner.sendTransactionAsync(owner.toLowerCase(), txData);
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
         * @param owner Address of new owner.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
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
        async validateAndSendTransactionAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).addOwner.callAsync(owner, txData);
            const txHash = await (this as any).addOwner.sendTransactionAsync(owner, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param owner Address of new owner.
         */
        async callAsync(owner: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('owner', owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('addOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param owner Address of new owner.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(owner: string): string {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('addOwner(address)', [owner.toLowerCase()]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows to change the number of required confirmations. Transaction has to be sent by wallet.
     */
    public changeRequirement = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param _required Number of required confirmations.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(_required: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
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
         * @param _required Number of required confirmations.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _required: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.changeRequirement.sendTransactionAsync(_required, txData);
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
         * @param _required Number of required confirmations.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(_required: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
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
            _required: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).changeRequirement.callAsync(_required, txData);
            const txHash = await (this as any).changeRequirement.sendTransactionAsync(_required, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _required Number of required confirmations.
         */
        async callAsync(
            _required: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('_required', _required);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
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
            const abiEncoder = self._lookupAbiEncoder('changeRequirement(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _required Number of required confirmations.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_required: BigNumber): string {
            assert.isBigNumber('_required', _required);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('changeRequirement(uint256)', [_required]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Changes the duration of the time lock for transactions.
     */
    public changeTimeLock = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param _secondsTimeLocked Duration needed after a transaction is confirmed
         *     and before it becomes executable, in seconds.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked]);
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
         * @param _secondsTimeLocked Duration needed after a transaction is confirmed
         *     and before it becomes executable, in seconds.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.changeTimeLock.sendTransactionAsync(_secondsTimeLocked, txData);
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
         * @param _secondsTimeLocked Duration needed after a transaction is confirmed
         *     and before it becomes executable, in seconds.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(_secondsTimeLocked: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked]);
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
            _secondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).changeTimeLock.callAsync(_secondsTimeLocked, txData);
            const txHash = await (this as any).changeTimeLock.sendTransactionAsync(_secondsTimeLocked, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param _secondsTimeLocked Duration needed after a transaction is confirmed
         *     and before it becomes executable, in seconds.
         */
        async callAsync(
            _secondsTimeLocked: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('changeTimeLock(uint256)', [_secondsTimeLocked]);
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
            const abiEncoder = self._lookupAbiEncoder('changeTimeLock(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param _secondsTimeLocked Duration needed after a transaction is confirmed
         *     and before it becomes executable, in seconds.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(_secondsTimeLocked: BigNumber): string {
            assert.isBigNumber('_secondsTimeLocked', _secondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('changeTimeLock(uint256)', [
                _secondsTimeLocked,
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows an owner to confirm a transaction.
     */
    public confirmTransaction = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId]);
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
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.confirmTransaction.sendTransactionAsync(transactionId, txData);
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
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId]);
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
            transactionId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).confirmTransaction.callAsync(transactionId, txData);
            const txHash = await (this as any).confirmTransaction.sendTransactionAsync(transactionId, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transactionId Transaction ID.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmTransaction(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('confirmTransaction(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param transactionId Transaction ID.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('confirmTransaction(uint256)', [
                transactionId,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public confirmationTimes = {
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmationTimes(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('confirmationTimes(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public confirmations = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isBigNumber('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('confirmations(uint256,address)', [
                index_0,
                index_1.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('confirmations(uint256,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Allows anyone to execute a confirmed transaction.
     * Transactions *must* encode the values with the signature "bytes[] data, address[] destinations, uint256[] values"
     * The `destination` and `value` fields of the transaction in storage are ignored.
     * All function calls must be successful or the entire call will revert.
     */
    public executeTransaction = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId]);
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
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.executeTransaction.sendTransactionAsync(transactionId, txData);
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
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId]);
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
            transactionId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).executeTransaction.callAsync(transactionId, txData);
            const txHash = await (this as any).executeTransaction.sendTransactionAsync(transactionId, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transactionId Transaction ID.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('executeTransaction(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('executeTransaction(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param transactionId Transaction ID.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('executeTransaction(uint256)', [
                transactionId,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public functionCallTimeLocks = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            index_1: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[boolean, BigNumber]> {
            assert.isString('index_0', index_0);
            assert.isString('index_1', index_1);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('functionCallTimeLocks(bytes4,address)', [
                index_0,
                index_1.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('functionCallTimeLocks(bytes4,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[boolean, BigNumber]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Returns number of confirmations of a transaction.
     */
    public getConfirmationCount = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transactionId Transaction ID.
         * @returns Number of confirmations.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getConfirmationCount(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('getConfirmationCount(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Returns array with owner addresses, which confirmed transaction.
     */
    public getConfirmations = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transactionId Transaction ID.
         * @returns Returns array of owner addresses.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<string[]> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getConfirmations(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('getConfirmations(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Returns list of owners.
     */
    public getOwners = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @returns List of owner addresses.
         */
        async callAsync(callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<string[]> {
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getOwners()', []);
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
            const abiEncoder = self._lookupAbiEncoder('getOwners()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Returns total number of transactions after filers are applied.
     */
    public getTransactionCount = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param pending Include pending transactions.
         * @param executed Include executed transactions.
         * @returns Total number of transactions after filters are applied.
         */
        async callAsync(
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isBoolean('pending', pending);
            assert.isBoolean('executed', executed);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getTransactionCount(bool,bool)', [pending, executed]);
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
            const abiEncoder = self._lookupAbiEncoder('getTransactionCount(bool,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Returns list of transaction IDs in defined range.
     */
    public getTransactionIds = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param from Index start position of transaction array.
         * @param to Index end position of transaction array.
         * @param pending Include pending transactions.
         * @param executed Include executed transactions.
         * @returns Returns array of transaction IDs.
         */
        async callAsync(
            from: BigNumber,
            to: BigNumber,
            pending: boolean,
            executed: boolean,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber[]> {
            assert.isBigNumber('from', from);
            assert.isBigNumber('to', to);
            assert.isBoolean('pending', pending);
            assert.isBoolean('executed', executed);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('getTransactionIds(uint256,uint256,bool,bool)', [
                from,
                to,
                pending,
                executed,
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
            const abiEncoder = self._lookupAbiEncoder('getTransactionIds(uint256,uint256,bool,bool)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber[]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Returns the confirmation status of a transaction.
     */
    public isConfirmed = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transactionId Transaction ID.
         * @returns Confirmation status.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isConfirmed(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('isConfirmed(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public isOwner = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<boolean> {
            assert.isString('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('isOwner(address)', [index_0.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('isOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<boolean>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public owners = {
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('owners(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('owners(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<string>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Registers a custom timelock to a specific function selector / destination combo
     */
    public registerFunctionCall = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param hasCustomTimeLock True if timelock is custom.
         * @param functionSelector 4 byte selector of registered function.
         * @param destination Address of destination where function will be called.
         * @param newSecondsTimeLocked Duration in seconds needed after a transaction
         *     is confirmed to become executable.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            hasCustomTimeLock: boolean,
            functionSelector: string,
            destination: string,
            newSecondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isBoolean('hasCustomTimeLock', hasCustomTimeLock);
            assert.isString('functionSelector', functionSelector);
            assert.isString('destination', destination);
            assert.isBigNumber('newSecondsTimeLocked', newSecondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerFunctionCall(bool,bytes4,address,uint128)', [
                hasCustomTimeLock,
                functionSelector,
                destination.toLowerCase(),
                newSecondsTimeLocked,
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
         * @param hasCustomTimeLock True if timelock is custom.
         * @param functionSelector 4 byte selector of registered function.
         * @param destination Address of destination where function will be called.
         * @param newSecondsTimeLocked Duration in seconds needed after a transaction
         *     is confirmed to become executable.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            hasCustomTimeLock: boolean,
            functionSelector: string,
            destination: string,
            newSecondsTimeLocked: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBoolean('hasCustomTimeLock', hasCustomTimeLock);
            assert.isString('functionSelector', functionSelector);
            assert.isString('destination', destination);
            assert.isBigNumber('newSecondsTimeLocked', newSecondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.registerFunctionCall.sendTransactionAsync(
                hasCustomTimeLock,
                functionSelector,
                destination.toLowerCase(),
                newSecondsTimeLocked,
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
         * @param hasCustomTimeLock True if timelock is custom.
         * @param functionSelector 4 byte selector of registered function.
         * @param destination Address of destination where function will be called.
         * @param newSecondsTimeLocked Duration in seconds needed after a transaction
         *     is confirmed to become executable.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            hasCustomTimeLock: boolean,
            functionSelector: string,
            destination: string,
            newSecondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isBoolean('hasCustomTimeLock', hasCustomTimeLock);
            assert.isString('functionSelector', functionSelector);
            assert.isString('destination', destination);
            assert.isBigNumber('newSecondsTimeLocked', newSecondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerFunctionCall(bool,bytes4,address,uint128)', [
                hasCustomTimeLock,
                functionSelector,
                destination.toLowerCase(),
                newSecondsTimeLocked,
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
            hasCustomTimeLock: boolean,
            functionSelector: string,
            destination: string,
            newSecondsTimeLocked: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).registerFunctionCall.callAsync(
                hasCustomTimeLock,
                functionSelector,
                destination,
                newSecondsTimeLocked,
                txData,
            );
            const txHash = await (this as any).registerFunctionCall.sendTransactionAsync(
                hasCustomTimeLock,
                functionSelector,
                destination,
                newSecondsTimeLocked,
                txData,
            );
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param hasCustomTimeLock True if timelock is custom.
         * @param functionSelector 4 byte selector of registered function.
         * @param destination Address of destination where function will be called.
         * @param newSecondsTimeLocked Duration in seconds needed after a transaction
         *     is confirmed to become executable.
         */
        async callAsync(
            hasCustomTimeLock: boolean,
            functionSelector: string,
            destination: string,
            newSecondsTimeLocked: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBoolean('hasCustomTimeLock', hasCustomTimeLock);
            assert.isString('functionSelector', functionSelector);
            assert.isString('destination', destination);
            assert.isBigNumber('newSecondsTimeLocked', newSecondsTimeLocked);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('registerFunctionCall(bool,bytes4,address,uint128)', [
                hasCustomTimeLock,
                functionSelector,
                destination.toLowerCase(),
                newSecondsTimeLocked,
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
            const abiEncoder = self._lookupAbiEncoder('registerFunctionCall(bool,bytes4,address,uint128)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param hasCustomTimeLock True if timelock is custom.
         * @param functionSelector 4 byte selector of registered function.
         * @param destination Address of destination where function will be called.
         * @param newSecondsTimeLocked Duration in seconds needed after a transaction
         *     is confirmed to become executable.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(
            hasCustomTimeLock: boolean,
            functionSelector: string,
            destination: string,
            newSecondsTimeLocked: BigNumber,
        ): string {
            assert.isBoolean('hasCustomTimeLock', hasCustomTimeLock);
            assert.isString('functionSelector', functionSelector);
            assert.isString('destination', destination);
            assert.isBigNumber('newSecondsTimeLocked', newSecondsTimeLocked);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments(
                'registerFunctionCall(bool,bytes4,address,uint128)',
                [hasCustomTimeLock, functionSelector, destination.toLowerCase(), newSecondsTimeLocked],
            );
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows to remove an owner. Transaction has to be sent by wallet.
     */
    public removeOwner = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param owner Address of owner.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner.toLowerCase()]);
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
         * @param owner Address of owner.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            owner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.removeOwner.sendTransactionAsync(owner.toLowerCase(), txData);
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
         * @param owner Address of owner.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner.toLowerCase()]);
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
        async validateAndSendTransactionAsync(owner: string, txData?: Partial<TxData> | undefined): Promise<string> {
            await (this as any).removeOwner.callAsync(owner, txData);
            const txHash = await (this as any).removeOwner.sendTransactionAsync(owner, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param owner Address of owner.
         */
        async callAsync(owner: string, callData: Partial<CallData> = {}, defaultBlock?: BlockParam): Promise<void> {
            assert.isString('owner', owner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('removeOwner(address)', [owner.toLowerCase()]);
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
            const abiEncoder = self._lookupAbiEncoder('removeOwner(address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param owner Address of owner.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(owner: string): string {
            assert.isString('owner', owner);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('removeOwner(address)', [
                owner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    /**
     * Allows to replace an owner with a new owner. Transaction has to be sent by wallet.
     */
    public replaceOwner = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param owner Address of owner to be replaced.
         * @param newOwner Address of new owner.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            owner: string,
            newOwner: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
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
         * @param owner Address of owner to be replaced.
         * @param newOwner Address of new owner.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            owner: string,
            newOwner: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.replaceOwner.sendTransactionAsync(
                owner.toLowerCase(),
                newOwner.toLowerCase(),
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
         * @param owner Address of owner to be replaced.
         * @param newOwner Address of new owner.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(owner: string, newOwner: string, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
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
            owner: string,
            newOwner: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).replaceOwner.callAsync(owner, newOwner, txData);
            const txHash = await (this as any).replaceOwner.sendTransactionAsync(owner, newOwner, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param owner Address of owner to be replaced.
         * @param newOwner Address of new owner.
         */
        async callAsync(
            owner: string,
            newOwner: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('replaceOwner(address,address)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param owner Address of owner to be replaced.
         * @param newOwner Address of new owner.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(owner: string, newOwner: string): string {
            assert.isString('owner', owner);
            assert.isString('newOwner', newOwner);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('replaceOwner(address,address)', [
                owner.toLowerCase(),
                newOwner.toLowerCase(),
            ]);
            return abiEncodedTransactionData;
        },
    };
    public required = {
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('required()', []);
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
            const abiEncoder = self._lookupAbiEncoder('required()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Allows an owner to revoke a confirmation for a transaction.
     */
    public revokeConfirmation = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<string> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId]);
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
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            transactionId: BigNumber,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.revokeConfirmation.sendTransactionAsync(transactionId, txData);
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
         * @param transactionId Transaction ID.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(transactionId: BigNumber, txData?: Partial<TxData> | undefined): Promise<number> {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId]);
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
            transactionId: BigNumber,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).revokeConfirmation.callAsync(transactionId, txData);
            const txHash = await (this as any).revokeConfirmation.sendTransactionAsync(transactionId, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param transactionId Transaction ID.
         */
        async callAsync(
            transactionId: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<void> {
            assert.isBigNumber('transactionId', transactionId);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('revokeConfirmation(uint256)', [transactionId]);
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
            const abiEncoder = self._lookupAbiEncoder('revokeConfirmation(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<void>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param transactionId Transaction ID.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(transactionId: BigNumber): string {
            assert.isBigNumber('transactionId', transactionId);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('revokeConfirmation(uint256)', [
                transactionId,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public secondsTimeLocked = {
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('secondsTimeLocked()', []);
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
            const abiEncoder = self._lookupAbiEncoder('secondsTimeLocked()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    /**
     * Allows an owner to submit and confirm a transaction.
     */
    public submitTransaction = {
        /**
         * Sends an Ethereum transaction executing this method with the supplied parameters. This is a read/write
         * Ethereum operation and will cost gas.
         * @param destination Transaction target address.
         * @param value Transaction ether value.
         * @param data Transaction data payload.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async sendTransactionAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
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
         * @param destination Transaction target address.
         * @param value Transaction ether value.
         * @param data Transaction data payload.
         * @param txData Additional data for transaction
         * @param pollingIntervalMs Interval at which to poll for success
         * @returns A promise that resolves when the transaction is successful
         */
        awaitTransactionSuccessAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData>,
            pollingIntervalMs?: number,
            timeoutMs?: number,
        ): PromiseWithTransactionHash<TransactionReceiptWithDecodedLogs> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const txHashPromise = self.submitTransaction.sendTransactionAsync(
                destination.toLowerCase(),
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
         * @param destination Transaction target address.
         * @param value Transaction ether value.
         * @param data Transaction data payload.
         * @param txData Additional data for transaction
         * @returns The hash of the transaction
         */
        async estimateGasAsync(
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<number> {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
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
            destination: string,
            value: BigNumber,
            data: string,
            txData?: Partial<TxData> | undefined,
        ): Promise<string> {
            await (this as any).submitTransaction.callAsync(destination, value, data, txData);
            const txHash = await (this as any).submitTransaction.sendTransactionAsync(destination, value, data, txData);
            return txHash;
        },
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         * @param destination Transaction target address.
         * @param value Transaction ether value.
         * @param data Transaction data payload.
         * @returns Returns transaction ID.
         */
        async callAsync(
            destination: string,
            value: BigNumber,
            data: string,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<BigNumber> {
            assert.isString('destination', destination);
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
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
            const abiEncoder = self._lookupAbiEncoder('submitTransaction(address,uint256,bytes)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
        /**
         * Returns the ABI encoded transaction data needed to send an Ethereum transaction calling this method. Before
         * sending the Ethereum tx, this encoded tx data can first be sent to a separate signing service or can be used
         * to create a 0x transaction (see protocol spec for more details).
         * @param destination Transaction target address.
         * @param value Transaction ether value.
         * @param data Transaction data payload.
         * @returns The ABI encoded transaction data as a string
         */
        getABIEncodedTransactionData(destination: string, value: BigNumber, data: string): string {
            assert.isString('destination', destination);
            assert.isBigNumber('value', value);
            assert.isString('data', data);
            const self = (this as any) as AssetProxyOwnerContract;
            const abiEncodedTransactionData = self._strictEncodeArguments('submitTransaction(address,uint256,bytes)', [
                destination.toLowerCase(),
                value,
                data,
            ]);
            return abiEncodedTransactionData;
        },
    };
    public transactionCount = {
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
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('transactionCount()', []);
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
            const abiEncoder = self._lookupAbiEncoder('transactionCount()');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<BigNumber>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    public transactions = {
        /**
         * Sends a read-only call to the contract method. Returns the result that would happen if one were to send an
         * Ethereum transaction to this method, given the current state of the blockchain. Calls do not cost gas
         * since they don't modify state.
         */
        async callAsync(
            index_0: BigNumber,
            callData: Partial<CallData> = {},
            defaultBlock?: BlockParam,
        ): Promise<[string, BigNumber, string, boolean]> {
            assert.isBigNumber('index_0', index_0);
            assert.doesConformToSchema('callData', callData, schemas.callDataSchema, [
                schemas.addressSchema,
                schemas.numberSchema,
                schemas.jsNumber,
            ]);
            if (defaultBlock !== undefined) {
                assert.isBlockParam('defaultBlock', defaultBlock);
            }
            const self = (this as any) as AssetProxyOwnerContract;
            const encodedData = self._strictEncodeArguments('transactions(uint256)', [index_0]);
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
            const abiEncoder = self._lookupAbiEncoder('transactions(uint256)');
            // tslint:disable boolean-naming
            const result = abiEncoder.strictDecodeReturnValue<[string, BigNumber, string, boolean]>(rawCallResult);
            // tslint:enable boolean-naming
            return result;
        },
    };
    private readonly _subscriptionManager: SubscriptionManager<AssetProxyOwnerEventArgs, AssetProxyOwnerEvents>;
    public static async deployFrom0xArtifactAsync(
        artifact: ContractArtifact | SimpleContractArtifact,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractArtifact | SimpleContractArtifact },
        _functionSelectors: string[],
        _destinations: string[],
        _functionCallTimeLockSeconds: BigNumber[],
        _owners: string[],
        _required: BigNumber,
        _defaultSecondsTimeLocked: BigNumber,
    ): Promise<AssetProxyOwnerContract> {
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
        return AssetProxyOwnerContract.deployAsync(
            bytecode,
            abi,
            provider,
            txDefaults,
            logDecodeDependenciesAbiOnly,
            _functionSelectors,
            _destinations,
            _functionCallTimeLockSeconds,
            _owners,
            _required,
            _defaultSecondsTimeLocked,
        );
    }
    public static async deployAsync(
        bytecode: string,
        abi: ContractAbi,
        supportedProvider: SupportedProvider,
        txDefaults: Partial<TxData>,
        logDecodeDependencies: { [contractName: string]: ContractAbi },
        _functionSelectors: string[],
        _destinations: string[],
        _functionCallTimeLockSeconds: BigNumber[],
        _owners: string[],
        _required: BigNumber,
        _defaultSecondsTimeLocked: BigNumber,
    ): Promise<AssetProxyOwnerContract> {
        assert.isHexString('bytecode', bytecode);
        assert.doesConformToSchema('txDefaults', txDefaults, schemas.txDataSchema, [
            schemas.addressSchema,
            schemas.numberSchema,
            schemas.jsNumber,
        ]);
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        const constructorAbi = BaseContract._lookupConstructorAbi(abi);
        [
            _functionSelectors,
            _destinations,
            _functionCallTimeLockSeconds,
            _owners,
            _required,
            _defaultSecondsTimeLocked,
        ] = BaseContract._formatABIDataItemList(
            constructorAbi.inputs,
            [
                _functionSelectors,
                _destinations,
                _functionCallTimeLockSeconds,
                _owners,
                _required,
                _defaultSecondsTimeLocked,
            ],
            BaseContract._bigNumberToString,
        );
        const iface = new ethers.utils.Interface(abi);
        const deployInfo = iface.deployFunction;
        const txData = deployInfo.encode(bytecode, [
            _functionSelectors,
            _destinations,
            _functionCallTimeLockSeconds,
            _owners,
            _required,
            _defaultSecondsTimeLocked,
        ]);
        const web3Wrapper = new Web3Wrapper(provider);
        const txDataWithDefaults = await BaseContract._applyDefaultsToTxDataAsync(
            { data: txData },
            txDefaults,
            web3Wrapper.estimateGasAsync.bind(web3Wrapper),
        );
        const txHash = await web3Wrapper.sendTransactionAsync(txDataWithDefaults);
        logUtils.log(`transactionHash: ${txHash}`);
        const txReceipt = await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        logUtils.log(`AssetProxyOwner successfully deployed at ${txReceipt.contractAddress}`);
        const contractInstance = new AssetProxyOwnerContract(
            txReceipt.contractAddress as string,
            provider,
            txDefaults,
            logDecodeDependencies,
        );
        contractInstance.constructorArgs = [
            _functionSelectors,
            _destinations,
            _functionCallTimeLockSeconds,
            _owners,
            _required,
            _defaultSecondsTimeLocked,
        ];
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
                        name: '_functionSelectors',
                        type: 'bytes4[]',
                    },
                    {
                        name: '_destinations',
                        type: 'address[]',
                    },
                    {
                        name: '_functionCallTimeLockSeconds',
                        type: 'uint128[]',
                    },
                    {
                        name: '_owners',
                        type: 'address[]',
                    },
                    {
                        name: '_required',
                        type: 'uint256',
                    },
                    {
                        name: '_defaultSecondsTimeLocked',
                        type: 'uint256',
                    },
                ],
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'sender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Confirmation',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                    {
                        name: 'confirmationTime',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'ConfirmationTimeSet',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'sender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'Deposit',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Execution',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'ExecutionFailure',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'functionSelector',
                        type: 'bytes4',
                        indexed: false,
                    },
                    {
                        name: 'destination',
                        type: 'address',
                        indexed: false,
                    },
                    {
                        name: 'hasCustomTimeLock',
                        type: 'bool',
                        indexed: false,
                    },
                    {
                        name: 'newSecondsTimeLocked',
                        type: 'uint128',
                        indexed: false,
                    },
                ],
                name: 'FunctionCallTimeLockRegistration',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'OwnerAddition',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                        indexed: true,
                    },
                ],
                name: 'OwnerRemoval',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'required',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'RequirementChange',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'sender',
                        type: 'address',
                        indexed: true,
                    },
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Revocation',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                        indexed: true,
                    },
                ],
                name: 'Submission',
                outputs: [],
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        name: 'secondsTimeLocked',
                        type: 'uint256',
                        indexed: false,
                    },
                ],
                name: 'TimeLockChange',
                outputs: [],
                type: 'event',
            },
            {
                inputs: [],
                outputs: [],
                payable: true,
                stateMutability: 'payable',
                type: 'fallback',
            },
            {
                constant: true,
                inputs: [],
                name: 'MAX_OWNER_COUNT',
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
                        name: 'owner',
                        type: 'address',
                    },
                ],
                name: 'addOwner',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_required',
                        type: 'uint256',
                    },
                ],
                name: 'changeRequirement',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_secondsTimeLocked',
                        type: 'uint256',
                    },
                ],
                name: 'changeTimeLock',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'confirmTransaction',
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
                name: 'confirmationTimes',
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
                        name: 'index_0',
                        type: 'uint256',
                    },
                    {
                        name: 'index_1',
                        type: 'address',
                    },
                ],
                name: 'confirmations',
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
                constant: false,
                inputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'executeTransaction',
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
                        type: 'bytes4',
                    },
                    {
                        name: 'index_1',
                        type: 'address',
                    },
                ],
                name: 'functionCallTimeLocks',
                outputs: [
                    {
                        name: 'hasCustomTimeLock',
                        type: 'bool',
                    },
                    {
                        name: 'secondsTimeLocked',
                        type: 'uint128',
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
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'getConfirmationCount',
                outputs: [
                    {
                        name: 'count',
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
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'getConfirmations',
                outputs: [
                    {
                        name: '_confirmations',
                        type: 'address[]',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'getOwners',
                outputs: [
                    {
                        name: '',
                        type: 'address[]',
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
                        name: 'pending',
                        type: 'bool',
                    },
                    {
                        name: 'executed',
                        type: 'bool',
                    },
                ],
                name: 'getTransactionCount',
                outputs: [
                    {
                        name: 'count',
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
                        name: 'from',
                        type: 'uint256',
                    },
                    {
                        name: 'to',
                        type: 'uint256',
                    },
                    {
                        name: 'pending',
                        type: 'bool',
                    },
                    {
                        name: 'executed',
                        type: 'bool',
                    },
                ],
                name: 'getTransactionIds',
                outputs: [
                    {
                        name: '_transactionIds',
                        type: 'uint256[]',
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
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'isConfirmed',
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
                        name: 'index_0',
                        type: 'address',
                    },
                ],
                name: 'isOwner',
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
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'owners',
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
                        name: 'hasCustomTimeLock',
                        type: 'bool',
                    },
                    {
                        name: 'functionSelector',
                        type: 'bytes4',
                    },
                    {
                        name: 'destination',
                        type: 'address',
                    },
                    {
                        name: 'newSecondsTimeLocked',
                        type: 'uint128',
                    },
                ],
                name: 'registerFunctionCall',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                    },
                ],
                name: 'removeOwner',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'owner',
                        type: 'address',
                    },
                    {
                        name: 'newOwner',
                        type: 'address',
                    },
                ],
                name: 'replaceOwner',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'required',
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
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                name: 'revokeConfirmation',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'secondsTimeLocked',
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
                        name: 'destination',
                        type: 'address',
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
                name: 'submitTransaction',
                outputs: [
                    {
                        name: 'transactionId',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'transactionCount',
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
                        name: 'index_0',
                        type: 'uint256',
                    },
                ],
                name: 'transactions',
                outputs: [
                    {
                        name: 'destination',
                        type: 'address',
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                    },
                    {
                        name: 'data',
                        type: 'bytes',
                    },
                    {
                        name: 'executed',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
        ] as ContractAbi;
        return abi;
    }
    /**
     * Subscribe to an event type emitted by the AssetProxyOwner contract.
     * @param eventName The AssetProxyOwner contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends AssetProxyOwnerEventArgs>(
        eventName: AssetProxyOwnerEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
        blockPollingIntervalMs?: number,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, AssetProxyOwnerEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            this.address,
            eventName,
            indexFilterValues,
            AssetProxyOwnerContract.ABI(),
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
     * @param eventName The AssetProxyOwner contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends AssetProxyOwnerEventArgs>(
        eventName: AssetProxyOwnerEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, AssetProxyOwnerEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            this.address,
            eventName,
            blockRange,
            indexFilterValues,
            AssetProxyOwnerContract.ABI(),
        );
        return logs;
    }
    constructor(
        address: string,
        supportedProvider: SupportedProvider,
        txDefaults?: Partial<TxData>,
        logDecodeDependencies?: { [contractName: string]: ContractAbi },
        deployedBytecode: string | undefined = AssetProxyOwnerContract.deployedBytecode,
    ) {
        super(
            'AssetProxyOwner',
            AssetProxyOwnerContract.ABI(),
            address,
            supportedProvider,
            txDefaults,
            logDecodeDependencies,
            deployedBytecode,
        );
        classUtils.bindAll(this, ['_abiEncoderByFunctionSignature', 'address', '_web3Wrapper']);
        this._subscriptionManager = new SubscriptionManager<AssetProxyOwnerEventArgs, AssetProxyOwnerEvents>(
            AssetProxyOwnerContract.ABI(),
            this._web3Wrapper,
        );
    }
}

// tslint:disable:max-file-line-count
// tslint:enable:no-unbound-method no-parameter-reassignment no-consecutive-blank-lines ordered-imports align
// tslint:enable:trailing-comma whitespace no-trailing-whitespace
