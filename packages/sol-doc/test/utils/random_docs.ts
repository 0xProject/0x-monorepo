import * as _ from 'lodash';

import {
    ContractDocs,
    ContractKind,
    ContractMethodDocs,
    DocumentedItem,
    EnumDocs,
    EnumValueDocs,
    EventDocs,
    FunctionKind,
    ParamDocs,
    ParamDocsMap,
    StateMutability,
    StorageLocation,
    StructDocs,
    Visibility,
} from '../../src/sol_doc';

// tslint:disable: custom-no-magic-numbers
const LETTERS = _.times(26, n => String.fromCharCode('a'.charCodeAt(0) + n));

export function randomWord(maxLength: number = 13): string {
    return _.sampleSize(LETTERS, _.random(1, maxLength)).join('');
}

export function randomSentence(): string {
    const numWords = _.random(3, 64);
    return _.capitalize(_.times(numWords, () => randomWord()).join(' ').concat('.'));
}

export function randomDocs(): DocumentedItem {
    return {
        doc: randomSentence(),
        line: _.random(1, 65536),
        file: _.capitalize(randomWord()).concat('.sol'),
    };
}

export function randomBoolean(): boolean {
    return _.random(0, 1) === 1;
}

export function randomType(): string {
    return _.sampleSize([
            'uint256',
            'bytes32',
            'bool',
            'uint32',
            'int256',
            'int64',
            'uint8',
        ],
        1,
    )[0];
}

export function randomStorageLocation(): StorageLocation {
    return _.sampleSize([
        StorageLocation.Default,
        StorageLocation.Memory,
        StorageLocation.Storage,
    ])[0];
}

export function randomContractKind(): ContractKind {
    return _.sampleSize([
        ContractKind.Contract,
        ContractKind.Interface,
        ContractKind.Library,
    ])[0];
}

export function randomMutability(): StateMutability {
    return _.sampleSize([
        StateMutability.Nonpayable,
        StateMutability.Payable,
        StateMutability.Pure,
        StateMutability.View,
    ])[0];
}

export function randomVisibility(): Visibility {
    return _.sampleSize([
        Visibility.External,
        Visibility.Internal,
        Visibility.Public,
        Visibility.Private,
    ])[0];
}

export function randomFunctionKind(): FunctionKind {
    return _.sampleSize([
        FunctionKind.Constructor,
        FunctionKind.Fallback,
        FunctionKind.Function,
    ])[0];
}

export function randomParameters(): ParamDocsMap {
    const numParams = _.random(0, 7);
    return _.zipObject(
        _.times(numParams, () => randomWord()),
        _.times(numParams, idx => randomParameter(idx)),
    );
}

export function randomParameter(order: number, fields?: Partial<ParamDocs>): ParamDocs {
    return {
        ...randomDocs(),
        type: randomType(),
        indexed: randomBoolean(),
        storageLocation: randomStorageLocation(),
        order,
        ...fields,
    };
}

export function randomEvent(fields?: Partial<EventDocs>): EventDocs {
    return {
        ...randomDocs(),
        contract: `${randomWord()}Contract`,
        name: `${randomWord()}Event`,
        parameters: randomParameters(),
        ...fields,
    };
}

export function randomMethod(fields?: Partial<ContractMethodDocs>): ContractMethodDocs {
    return {
        ...randomDocs(),
        contract: `${randomWord()}Contract`,
        name: `${randomWord()}Method`,
        kind: randomFunctionKind(),
        isAccessor: randomBoolean(),
        stateMutability: randomMutability(),
        visibility: randomVisibility(),
        returns: randomParameters(),
        parameters: randomParameters(),
        ...fields,
    };
}

export function randomStruct(fields?: Partial<StructDocs>): StructDocs {
    return {
        ...randomDocs(),
        contract: `${randomWord()}Contract`,
        fields: randomParameters(),
        ...fields,
    };
}

export function randomEnum(fields?: Partial<EnumDocs>): EnumDocs {
    return {
        ...randomDocs(),
        contract: `${randomWord()}Contract`,
        values: _.mapValues(_.groupBy(_.times(_.random(1, 8), i =>
                ({
                    ...randomDocs(),
                    value: i,
                    name: randomWord(),
                })),
                'name',
            ),
            v => _.omit(v[0], 'name') as any as EnumValueDocs,
        ),
        ...fields,
    };
}

export function randomContract(contractName: string, fields?: Partial<ContractDocs>): ContractDocs {
    return {
        ...randomDocs(),
        kind: randomContractKind(),
        inherits: [],
        events: _.times(_.random(1, 4), () => randomEvent({ contract: contractName })),
        methods: _.times(_.random(1, 4), () => randomMethod({ contract: contractName })),
        structs: _.mapValues(_.groupBy(_.times(_.random(1, 4), () =>
                ({
                    ...randomStruct({ contract: contractName }),
                    name: `${randomWord()}Struct`,
                })),
                'name',
            ),
            v => _.omit(v[0], 'name') as any as StructDocs,
        ),
        enums: _.mapValues(_.groupBy(_.times(_.random(1, 4), () =>
                ({
                    ...randomEnum({ contract: contractName }),
                    name: `${randomWord()}Struct`,
                })),
                'name',
            ),
            v => _.omit(v[0], 'name') as any as EnumDocs,
        ),
        ...fields,
    };
}
