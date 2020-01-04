import { chaiSetup } from '@0x/dev-utils';
import { expect } from 'chai';
import * as _ from 'lodash';
import * as path from 'path';

import { extractDocsAsync, MethodDocs, SolidityDocs, StorageLocation, Visibility } from '../src/extract_docs';

chaiSetup.configure();

// tslint:disable: custom-no-magic-numbers
describe('extractDocsAsync()', () => {
    const INTERFACE_CONTRACT = 'InterfaceContract';
    const TEST_CONTRACT = 'TestContract';
    const BASE_CONTRACT = 'BaseContract';
    const LIBRARY_CONTRACT = 'LibraryContract';
    const INPUT_CONTRACTS = [TEST_CONTRACT, BASE_CONTRACT, LIBRARY_CONTRACT, INTERFACE_CONTRACT];
    const INPUT_FILE_PATHS = INPUT_CONTRACTS.map(f => path.resolve(__dirname, '../../test/inputs', `${f}.sol`));

    let docs: SolidityDocs;

    function createDocString(itemName: string): string {
        return `Documentation for \`${itemName}\`.`;
    }

    before(async () => {
        docs = await extractDocsAsync(_.shuffle(INPUT_FILE_PATHS));
    });

    describe('contracts', () => {
        it('extracts all contracts with docs', async () => {
            const contractLines: { [name: string]: number } = {
                [TEST_CONTRACT]: 10,
                [BASE_CONTRACT]: 9,
                [INTERFACE_CONTRACT]: 4,
                [LIBRARY_CONTRACT]: 5,
            };
            const NO_DOCS = [INTERFACE_CONTRACT];
            for (const contract of INPUT_CONTRACTS) {
                const cd = docs.contracts[contract];
                expect(cd).to.exist('');
                if (NO_DOCS.includes(contract)) {
                    expect(cd.doc).to.eq('');
                } else {
                    expect(cd.doc).to.eq(createDocString(contract));
                }
                expect(cd.line, `${contract}.line`).to.eq(contractLines[contract]);
            }
        });

        it('extracts contract inheritance', async () => {
            const contractInherits: { [name: string]: string[] } = {
                [TEST_CONTRACT]: [BASE_CONTRACT, INTERFACE_CONTRACT],
                [BASE_CONTRACT]: [],
                [INTERFACE_CONTRACT]: [],
                [LIBRARY_CONTRACT]: [],
            };
            for (const contract of INPUT_CONTRACTS) {
                const cd = docs.contracts[contract];
                expect(cd.inherits).to.deep.eq(contractInherits[contract]);
            }
        });
    });

    describe('methods', () => {
        interface ExpectedMethodProps {
            noDoc?: boolean;
            line: number;
            visibility: Visibility;
            params?: {
                [name: string]: {
                    noDoc?: boolean;
                    line: number;
                    type: string;
                    storage?: StorageLocation;
                };
            };
            returns?: {
                [name: string]: {
                    noDoc?: boolean;
                    line: number;
                    type: string;
                    storage?: StorageLocation;
                };
            };
        }

        function assertMethodDocs(fullMethodName: string, props: ExpectedMethodProps): void {
            const [contractName, methodName] = fullMethodName.split('.');
            const m = docs.contracts[contractName].methods.find(_m => _m.name === methodName) as MethodDocs;
            {
                const doc = props.noDoc ? '' : createDocString(methodName);
                expect(m).to.exist('');
                expect(m.visibility).to.eq(props.visibility);
                expect(m.contract).to.eq(contractName);
                expect(m.doc).to.eq(doc);
            }
            const params = props.params || {};
            expect(Object.keys(m.parameters), 'number of parameters').to.be.length(Object.keys(params).length);
            for (const [paramName, paramDoc] of Object.entries(params)) {
                const actualParam = m.parameters[paramName];
                const doc = paramDoc.noDoc ? '' : createDocString(paramName);
                const storage = paramDoc.storage === undefined ? StorageLocation.Default : paramDoc.storage;
                expect(actualParam).to.exist('');
                expect(actualParam.doc).to.eq(doc);
                expect(actualParam.line).to.eq(paramDoc.line);
                expect(actualParam.storageLocation).to.eq(storage);
                expect(actualParam.type).to.eq(paramDoc.type);
            }
            const returns = props.returns || {};
            expect(Object.keys(m.returns), 'number of returns').to.be.length(Object.keys(returns).length);
            for (const [returnName, returnDoc] of Object.entries(returns)) {
                const actualReturn = m.returns[returnName];
                const doc = returnDoc.noDoc ? '' : createDocString(returnName);
                const storage = returnDoc.storage === undefined ? StorageLocation.Default : returnDoc.storage;
                expect(actualReturn).to.exist('');
                expect(actualReturn.doc).to.eq(doc);
                expect(actualReturn.line).to.eq(returnDoc.line);
                expect(actualReturn.storageLocation).to.eq(storage);
                expect(actualReturn.type).to.eq(returnDoc.type);
            }
        }

        describe('`TestContract`', () => {
            it('`testContractMethod1`', () => {
                assertMethodDocs('TestContract.testContractMethod1', {
                    line: 15,
                    visibility: Visibility.Public,
                });
            });

            it('`testContractMethod2`', () => {
                assertMethodDocs('TestContract.testContractMethod2', {
                    line: 15,
                    visibility: Visibility.Internal,
                    params: {
                        p1: {
                            line: 24,
                            type: 'address',
                        },
                        p2: {
                            line: 25,
                            type: 'uint256',
                        },
                        p3: {
                            line: 26,
                            type: 'LibraryContract.LibraryContractEnum',
                        },
                    },
                    returns: {
                        r1: {
                            line: 29,
                            type: 'int32',
                        },
                    },
                });
            });

            it('`testContractMethod3`', () => {
                assertMethodDocs('TestContract.testContractMethod3', {
                    line: 37,
                    visibility: Visibility.External,
                    params: {
                        p1: {
                            line: 37,
                            type: 'InterfaceContract.InterfaceStruct',
                            storage: StorageLocation.CallData,
                        },
                    },
                    returns: {
                        r1: {
                            line: 39,
                            type: 'bytes32[][]',
                            storage: StorageLocation.Memory,
                        },
                    },
                });
            });

            it('`testContractMethod4`', () => {
                assertMethodDocs('TestContract.testContractMethod4', {
                    line: 45,
                    visibility: Visibility.Private,
                    params: {
                        p1: {
                            line: 46,
                            type: 'LibraryContract.LibraryStruct[]',
                            noDoc: true,
                            storage: StorageLocation.Storage,
                        },
                        p2: {
                            line: 47,
                            type: 'InterfaceContract.InterfaceStruct[]',
                            noDoc: true,
                            storage: StorageLocation.Memory,
                        },
                        p3: {
                            line: 48,
                            type: 'bytes[]',
                            noDoc: true,
                            storage: StorageLocation.Memory,
                        },
                    },
                    returns: {
                        r1: {
                            line: 51,
                            type: 'bytes',
                            noDoc: true,
                            storage: StorageLocation.Memory,
                        },
                        r2: {
                            line: 51,
                            type: 'bytes',
                            noDoc: true,
                            storage: StorageLocation.Memory,
                        },
                    },
                });
            });
        });

        describe('`BaseContract`', () => {
            it('`baseContractMethod1`', () => {
                assertMethodDocs('BaseContract.baseContractMethod1', {
                    line: 36,
                    visibility: Visibility.Internal,
                    params: {
                        p1: {
                            line: 39,
                            type: 'bytes',
                            storage: StorageLocation.Memory,
                        },
                        p2: {
                            line: 39,
                            type: 'bytes32',
                        },
                    },
                    returns: {
                        '0': {
                            line: 41,
                            type: 'InterfaceContract.InterfaceStruct',
                            storage: StorageLocation.Memory,
                        },
                    },
                });
            });

            it('`baseContractField1`', () => {
                assertMethodDocs('BaseContract.baseContractField1', {
                    line: 26,
                    visibility: Visibility.External,
                    params: {
                        '0': {
                            line: 26,
                            type: 'bytes32',
                        },
                        '1': {
                            line: 26,
                            type: 'address',
                        },
                    },
                    returns: {
                        '0': {
                            line: 26,
                            type: 'InterfaceContract.InterfaceStruct',
                            storage: StorageLocation.Memory,
                        },
                    },
                });
            });

            it('`baseContractField2`', () => {
                assertMethodDocs('BaseContract.baseContractField2', {
                    line: 30,
                    visibility: Visibility.External,
                    params: {
                        '0': {
                            line: 30,
                            type: 'uint256',
                        },
                    },
                    returns: {
                        '0': {
                            noDoc: true,
                            line: 30,
                            type: 'bytes32',
                        },
                    },
                });
            });

            it('`baseContractField3`', () => {
                // This field is private so no method should exist for it.
                expect(docs.contracts.TestContract.events.find(e => e.name === 'baseContractField3')).to.eq(undefined);
            });
        });
    });

    describe('events', () => {
        interface ExpectedEventProps {
            noDoc?: boolean;
            line: number;
            params?: {
                [name: string]: {
                    noDoc?: boolean;
                    line: number;
                    type: string;
                    indexed?: boolean;
                };
            };
        }

        function assertEventDocs(fullEventName: string, props: ExpectedEventProps): void {
            const [contractName, eventName] = fullEventName.split('.');
            const e = docs.contracts[contractName].events.find(_e => _e.name === eventName) as MethodDocs;
            {
                const doc = props.noDoc ? '' : createDocString(eventName);
                expect(e).to.exist('');
                expect(e.contract).to.eq(contractName);
                expect(e.doc).to.eq(doc);
            }
            const params = props.params || {};
            expect(Object.keys(e.parameters), 'number of parameters').to.be.length(Object.keys(params).length);
            for (const [paramName, paramDoc] of Object.entries(params)) {
                const actualParam = e.parameters[paramName];
                const doc = paramDoc.noDoc ? '' : createDocString(paramName);
                const isIndexed = paramDoc.indexed === undefined ? false : paramDoc.indexed;
                expect(actualParam).to.exist('');
                expect(actualParam.doc).to.eq(doc);
                expect(actualParam.line).to.eq(paramDoc.line);
                expect(actualParam.indexed).to.eq(isIndexed);
                expect(actualParam.type).to.eq(paramDoc.type);
            }
        }

        describe('`BaseContract`', () => {
            it('`BaseContractEvent1`', () => {
                assertEventDocs('BaseContract.BaseContractEvent1', {
                    line: 14,
                    params: {
                        p1: {
                            line: 14,
                            type: 'address',
                            indexed: true,
                        },
                        p2: {
                            line: 14,
                            type: 'InterfaceContract.InterfaceStruct',
                        },
                    },
                });
            });

            it('`BaseContractEvent2`', () => {
                assertEventDocs('BaseContract.BaseContractEvent2', {
                    line: 16,
                    params: {
                        p1: {
                            line: 17,
                            type: 'uint256',
                            noDoc: true,
                        },
                        p2: {
                            line: 18,
                            type: 'uint256',
                            indexed: true,
                            noDoc: true,
                        },
                    },
                });
            });
        });
    });

    describe('enums', () => {
        interface ExpectedEnumProps {
            noDoc?: boolean;
            line: number;
            values?: {
                [name: string]: {
                    noDoc?: boolean;
                    line: number;
                    value: number;
                };
            };
        }

        function assertEnumDocs(fullEnumName: string, props: ExpectedEnumProps): void {
            const [contractName, enumName] = fullEnumName.split('.');
            const e = docs.contracts[contractName].enums[`${contractName}.${enumName}`];
            {
                const doc = props.noDoc ? '' : createDocString(enumName);
                expect(e).to.exist('');
                expect(e.contract).to.eq(contractName);
                expect(e.doc).to.eq(doc);
            }
            const values = props.values || {};
            expect(Object.keys(e.values), 'number of values').to.be.length(Object.keys(values).length);
            for (const [valueName, valueDoc] of Object.entries(values)) {
                const actualValue = e.values[valueName];
                const doc = valueDoc.noDoc ? '' : createDocString(valueName);
                expect(actualValue).to.exist('');
                expect(actualValue.doc).to.eq(doc);
                expect(actualValue.line).to.eq(valueDoc.line);
                expect(actualValue.value).to.eq(valueDoc.value);
            }
        }

        describe('`LibraryContract`', () => {
            it('`LibraryContractEnum`', () => {
                assertEnumDocs('LibraryContract.LibraryContractEnum', {
                    line: 9,
                    values: {
                        EnumMember1: {
                            line: 10,
                            value: 0,
                        },
                        EnumMember2: {
                            line: 11,
                            value: 1,
                        },
                        EnumMember3: {
                            line: 13,
                            value: 2,
                        },
                        EnumMember4: {
                            noDoc: true,
                            line: 14,
                            value: 3,
                        },
                    },
                });
            });
        });
    });

    describe('structs', () => {
        interface ExpectedStructProps {
            noDoc?: boolean;
            line: number;
            fields?: {
                [name: string]: {
                    noDoc?: boolean;
                    line: number;
                    type: string;
                    order: number;
                };
            };
        }

        function assertStructDocs(fullStructName: string, props: ExpectedStructProps): void {
            const [contractName, structName] = fullStructName.split('.');
            const s = docs.contracts[contractName].structs[`${contractName}.${structName}`];
            {
                const doc = props.noDoc ? '' : createDocString(structName);
                expect(s).to.exist('');
                expect(s.contract).to.eq(contractName);
                expect(s.doc).to.eq(doc);
            }
            const fields = props.fields || {};
            expect(Object.keys(s.fields), 'number of fields').to.be.length(Object.keys(fields).length);
            for (const [fieldName, fieldDoc] of Object.entries(fields)) {
                const actualField = s.fields[fieldName];
                const doc = fieldDoc.noDoc ? '' : createDocString(fieldName);
                expect(actualField).to.exist('');
                expect(actualField.doc).to.eq(doc);
                expect(actualField.line).to.eq(fieldDoc.line);
                expect(actualField.type).to.eq(fieldDoc.type);
                expect(actualField.storageLocation).to.eq(StorageLocation.Default);
                expect(actualField.indexed).to.eq(false);
            }
        }

        describe('`LibraryContract`', () => {
            it('`LibraryStruct`', () => {
                assertStructDocs('LibraryContract.LibraryStruct', {
                    line: 19,
                    fields: {
                        structField: {
                            line: 20,
                            type: 'mapping(bytes32 => address)',
                            order: 0,
                        },
                    },
                });
            });
        });

        describe('`InterfaceContract`', () => {
            it('`InterfaceStruct`', () => {
                assertStructDocs('InterfaceContract.InterfaceStruct', {
                    line: 9,
                    fields: {
                        structField1: {
                            line: 9,
                            type: 'address',
                            order: 0,
                        },
                        structField2: {
                            line: 10,
                            type: 'uint256',
                            order: 1,
                        },
                        structField3: {
                            line: 12,
                            type: 'bytes32',
                            order: 2,
                        },
                    },
                });
            });
        });
    });
});
// tslint:disable: max-file-line-count
