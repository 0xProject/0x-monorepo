import { chaiSetup } from '@0x/dev-utils';
import { expect } from 'chai';
import * as _ from 'lodash';

import { ContractKind, MethodDocs, EventDocs, FunctionKind, SolidityDocs, Visibility } from '../src/extract_docs';
import { transformDocs } from '../src/transform_docs';

import {
    randomContract,
    randomEnum,
    randomEvent,
    randomMethod,
    randomParameter,
    randomStruct,
    randomWord,
} from './utils/random_docs';

chaiSetup.configure();

// tslint:disable: custom-no-magic-numbers
describe('transformDocs()', () => {
    const INTERFACE_CONTRACT = 'InterfaceContract';
    const TEST_CONTRACT = 'TestContract';
    const BASE_CONTRACT = 'BaseContract';
    const OTHER_CONTRACT = 'OtherContract';
    const LIBRARY_CONTRACT = 'LibraryContract';
    const LIBRARY_EVENT = 'LibraryContract.LibraryEvent';
    const INTERFACE_EVENT = 'InterfaceContract.InterfaceEvent';
    const BASE_CONTRACT_EVENT = 'BaseContract.BaseContractEvent';
    const TEST_CONTRACT_EVENT = 'TestContract.TestContractEvent';
    const LIBRARY_ENUM = 'LibraryContract.LibraryEnum';
    const INTERFACE_ENUM = 'InterfaceContract.InterfaceEnum';
    const BASE_CONTRACT_ENUM = 'BaseContract.BaseContractEnum';
    const TEST_CONTRACT_ENUM = 'TestContract.TestContractEnum';
    const LIBRARY_STRUCT = 'LibraryContract.LibraryStruct';
    const INTERFACE_STRUCT = 'InterfaceContract.InterfaceStruct';
    const BASE_CONTRACT_STRUCT = 'BaseContract.BaseContractStruct';
    const TEST_CONTRACT_STRUCT = 'TestContract.TestContractStruct';
    const OTHER_CONTRACT_STRUCT = 'OtherContract.OtherContractStruct';
    const INPUT_DOCS: SolidityDocs = {
        contracts: {
            [LIBRARY_CONTRACT]: _.merge(randomContract(LIBRARY_CONTRACT, { kind: ContractKind.Library }), {
                events: {
                    [LIBRARY_EVENT]: randomEvent({ contract: LIBRARY_CONTRACT }),
                },
                structs: {
                    [LIBRARY_STRUCT]: randomStruct({ contract: LIBRARY_CONTRACT }),
                },
                enums: {
                    [LIBRARY_ENUM]: randomEnum({ contract: LIBRARY_CONTRACT }),
                },
            }),
            [INTERFACE_CONTRACT]: _.merge(randomContract(INTERFACE_CONTRACT, { kind: ContractKind.Interface }), {
                events: {
                    [INTERFACE_EVENT]: randomEvent({ contract: INTERFACE_CONTRACT }),
                },
                structs: {
                    [INTERFACE_STRUCT]: randomStruct({ contract: INTERFACE_CONTRACT }),
                },
                enums: {
                    [INTERFACE_ENUM]: randomEnum({ contract: INTERFACE_CONTRACT }),
                },
            }),
            [BASE_CONTRACT]: _.merge(randomContract(BASE_CONTRACT, { kind: ContractKind.Contract }), {
                events: {
                    [BASE_CONTRACT_EVENT]: randomEvent({ contract: BASE_CONTRACT }),
                },
                structs: {
                    [BASE_CONTRACT_STRUCT]: randomStruct({ contract: BASE_CONTRACT }),
                },
                enums: {
                    [BASE_CONTRACT_ENUM]: randomEnum({ contract: BASE_CONTRACT }),
                },
            }),
            [TEST_CONTRACT]: _.merge(
                randomContract(TEST_CONTRACT, { kind: ContractKind.Contract, inherits: [BASE_CONTRACT] }),
                {
                    methods: [
                        randomMethod({
                            contract: TEST_CONTRACT,
                            visibility: Visibility.External,
                            parameters: {
                                [randomWord()]: randomParameter(0, { type: INTERFACE_ENUM }),
                            },
                        }),
                        randomMethod({
                            contract: TEST_CONTRACT,
                            visibility: Visibility.Private,
                            parameters: {
                                [randomWord()]: randomParameter(0, { type: LIBRARY_STRUCT }),
                            },
                        }),
                    ],
                },
            ),
            [OTHER_CONTRACT]: _.merge(randomContract(OTHER_CONTRACT, { kind: ContractKind.Contract }), {
                structs: {
                    [OTHER_CONTRACT_STRUCT]: randomStruct({
                        contract: OTHER_CONTRACT,
                        fields: {
                            [randomWord()]: randomParameter(0, { type: LIBRARY_ENUM }),
                        },
                    }),
                },
                methods: [
                    randomMethod({
                        contract: OTHER_CONTRACT,
                        visibility: Visibility.Public,
                        returns: {
                            [randomWord()]: randomParameter(0, { type: OTHER_CONTRACT_STRUCT }),
                        },
                    }),
                    randomMethod({
                        contract: OTHER_CONTRACT,
                        visibility: Visibility.Internal,
                        returns: {
                            [randomWord()]: randomParameter(0, { type: INTERFACE_STRUCT }),
                        },
                    }),
                ],
                events: [
                    randomEvent({
                        contract: OTHER_CONTRACT,
                        parameters: {
                            [randomWord()]: randomParameter(0, { type: LIBRARY_STRUCT }),
                        },
                    }),
                ],
            }),
        },
    };

    function getMethodId(method: MethodDocs): string {
        if (method.kind === FunctionKind.Constructor) {
            return 'constructor';
        }
        return getEventId(method);
    }

    function getEventId(method: EventDocs | MethodDocs): string {
        const paramsTypes = Object.values(method.parameters).map(p => p.type);
        return `${method.name}(${paramsTypes.join(',')})`;
    }

    function getAllTypes(docs: SolidityDocs): string[] {
        const allTypes: string[] = [];
        for (const contract of Object.values(docs.contracts)) {
            for (const structName of Object.keys(contract.structs)) {
                allTypes.push(structName);
            }
            for (const enumName of Object.keys(contract.enums)) {
                allTypes.push(enumName);
            }
        }
        return allTypes;
    }

    it('returns all contracts with no target contracts', () => {
        const docs = transformDocs(INPUT_DOCS);
        expect(Object.keys(docs.contracts)).to.deep.eq([
            LIBRARY_CONTRACT,
            INTERFACE_CONTRACT,
            BASE_CONTRACT,
            TEST_CONTRACT,
            OTHER_CONTRACT,
        ]);
    });

    it('returns requested AND related contracts', () => {
        const contracts = [TEST_CONTRACT, OTHER_CONTRACT];
        const docs = transformDocs(INPUT_DOCS, { contracts });
        expect(Object.keys(docs.contracts)).to.deep.eq([LIBRARY_CONTRACT, INTERFACE_CONTRACT, ...contracts]);
    });

    it('returns exposed and unexposed items by default', () => {
        const contracts = [TEST_CONTRACT];
        const docs = transformDocs(INPUT_DOCS, { contracts });
        expect(Object.keys(docs.contracts)).to.deep.eq([LIBRARY_CONTRACT, INTERFACE_CONTRACT, ...contracts]);
        const allTypes = getAllTypes(docs);
        // Check for an exposed type.
        expect(allTypes).to.include(INTERFACE_ENUM);
        // Check for an unexposed type.
        expect(allTypes).to.include(LIBRARY_STRUCT);
    });

    it('can hide unexposed items', () => {
        const contracts = [OTHER_CONTRACT];
        const docs = transformDocs(INPUT_DOCS, { contracts, onlyExposed: true });
        expect(Object.keys(docs.contracts)).to.deep.eq([LIBRARY_CONTRACT, ...contracts]);
        const allTypes = getAllTypes(docs);
        // Check for an exposed type.
        expect(allTypes).to.include(LIBRARY_ENUM);
        // Check for an unexposed type.
        expect(allTypes).to.not.include(INTERFACE_STRUCT);
    });

    describe('flattening', () => {
        it('merges inherited methods', () => {
            const docs = transformDocs(INPUT_DOCS, { contracts: [TEST_CONTRACT], flatten: true });
            const allMethods = _.uniqBy(
                _.flatten(
                    [BASE_CONTRACT, TEST_CONTRACT].map(c =>
                        INPUT_DOCS.contracts[c].methods.filter(m => m.visibility !== Visibility.Private),
                    ),
                ),
                m => getMethodId(m),
            );
            const outputMethods = docs.contracts[TEST_CONTRACT].methods;
            expect(outputMethods).to.length(allMethods.length);
            for (const method of outputMethods) {
                expect(allMethods.map(m => getMethodId(m))).to.include(getMethodId(method));
            }
        });

        it('merges inherited events', () => {
            const docs = transformDocs(INPUT_DOCS, { contracts: [TEST_CONTRACT], flatten: true });
            const allEvents = _.uniqBy(
                _.flatten([BASE_CONTRACT, TEST_CONTRACT].map(c => INPUT_DOCS.contracts[c].events)),
                e => getEventId(e),
            );
            const outputEvents = docs.contracts[TEST_CONTRACT].events;
            expect(outputEvents).to.length(allEvents.length);
            for (const event of outputEvents) {
                expect(allEvents.map(m => getEventId(m))).to.include(getEventId(event));
            }
        });
    });
});
