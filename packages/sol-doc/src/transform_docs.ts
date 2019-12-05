import {
    ContractDocs,
    ContractMethodDocs,
    EventDocs,
    ParamDocsMap,
    SolidityDocs,
} from './sol_doc';

export interface TransformOpts {
    onlyExposed: boolean;
    flatten: boolean;
    contracts: string[];
}

interface TypesUsage {
    [type: string]: {
        methods: ContractMethodDocs[];
        events: EventDocs[];
        structs: string[];
    };
}

export function transformDocs(docs: SolidityDocs, opts: Partial<TransformOpts> = {}): SolidityDocs {
    const _opts = {
        onlyExposed: false,
        flatten: false,
        contracts: [],
        ...opts,
    };
    const _docs = {
        ...docs,
        contracts: { ...docs.contracts },
    };
    if (_opts.flatten) {
        for (const [contractName] of Object.entries(docs.contracts)) {
            _docs.contracts[contractName] = flattenContract(contractName, docs);
        }
    }
    return filterTypes(_docs, _opts.contracts || Object.keys(docs.contracts), _opts.onlyExposed);
}

function flattenContract(
    contractName: string,
    docs: SolidityDocs,
    seen: string[] = [],
): ContractDocs {
    seen.push(contractName);
    const contract = docs.contracts[contractName];
    const bases = [];
    for (const ancestor of contract.inherits) {
        if (!seen.includes(ancestor)) {
            bases.push(flattenContract(ancestor, docs, seen));
        }
    }
    return mergeContracts([...bases, contract]);
}

function mergeContracts(contracts: ContractDocs[]): ContractDocs {
    return {
        ...contracts[contracts.length - 1],
        methods: mergeMethods(concat(...contracts.map(c => c.methods))),
        events: mergeEvents(concat(...contracts.map(c => c.events))),
        enums: Object.assign({}, ...contracts.map(c => c.enums)),
        structs: Object.assign({}, ...contracts.map(c => c.structs)),
    };
}

function concat<T>(...arrs: T[][]): T[] {
    return arrs.reduce(
        (prev: T[], curr: T[]) => {
            prev.push(...curr);
            return prev;
        },
        [],
    );
}

function mergeMethods(methods: ContractMethodDocs[]): ContractMethodDocs[] {
    const ids: string[] = [];
    const merged: ContractMethodDocs[] = [];
    for (const method of methods) {
        const id = getMethodId(method.name, method.parameters);
        if (method.kind === 'constructor') {
            const constructorIndex = merged.findIndex(m => m.kind === 'constructor');
            if (constructorIndex !== -1) {
                merged[constructorIndex] = method;
                ids[constructorIndex] = id;
                continue;
            }
        }
        const existingIdx = ids.indexOf(id);
        if (existingIdx !== -1) {
            merged[existingIdx] = method;
            ids[existingIdx] = id;
        } else {
            merged.push(method);
            ids.push(id);
        }
    }
    return merged;
}

function mergeEvents(events: EventDocs[]): EventDocs[] {
    const ids: string[] = [];
    const merged: EventDocs[] = [];
    for (const event of events) {
        const selector = getMethodId(event.name, event.parameters);
        const existingIdx = ids.indexOf(selector);
        if (existingIdx !== -1) {
            events[existingIdx] = event;
            ids[existingIdx] = selector;
        } else {
            events.push(event);
            ids.push(selector);
        }
    }
    return merged;
}

function getMethodId(name: string, params: ParamDocsMap): string {
    const paramsTypes = Object.values(params).map(p => p.type);
    return `${name}(${paramsTypes.join(',')})`;
}

function filterTypes(docs: SolidityDocs, contracts: string[], onlyExposed: boolean = false): SolidityDocs {
    const contractsWithInheritance = [...contracts, ...getAllInheritedContracts(contracts, docs)];
    const filteredDocs: SolidityDocs = {
        ...docs,
        contracts: {},
    };
    const usages = getTypeUsage(docs);
    for (const [contractName, contract] of Object.entries(docs.contracts)) {
        const filteredContract: ContractDocs = {
            ...contract,
            methods: contract.methods.filter(m => !onlyExposed || isMethodVisible(m)),
            structs: {},
            enums: {},
        };
        for (const [typeName, doc] of Object.entries(contract.structs)) {
            if (isTypeUsedByContracts(typeName, usages, contractsWithInheritance, onlyExposed)) {
                filteredContract.structs[typeName] = doc;
            }
        }
        for (const [typeName, doc] of Object.entries(contract.enums)) {
            if (isTypeUsedByContracts(typeName, usages, contractsWithInheritance, onlyExposed)) {
                filteredContract.enums[typeName] = doc;
            }
        }
        if (contracts.includes(contractName) ||
            filteredContract.events.length !== 0 ||
            Object.keys(filteredContract.structs).length !== 0 ||
            Object.keys(filteredContract.enums).length !== 0
        ) {
            filteredDocs.contracts[contractName] = filteredContract;
        }
    }
    return filteredDocs;
}

function getAllInheritedContracts(contracts: string[], docs: SolidityDocs): string[] {
    const result: string[] = [];
    for (const contract of contracts) {
        for (const inherited of docs.contracts[contract].inherits) {
            if (result.includes(inherited)) {
                continue;
            }
            result.push(inherited, ...getAllInheritedContracts([inherited], docs));
        }
    }
    return result;
}

function getTypeUsage(docs: SolidityDocs): TypesUsage {
    const types: TypesUsage = {};
    const addTypeUser = (
        type: string,
        user: {method?: ContractMethodDocs; event?: EventDocs; struct?: string},
    ) => {
        if (types[type] === undefined) {
            types[type] = { methods: [], events: [], structs: [] };
        }
        if (user.method !== undefined) {
            types[type].methods.push(user.method);
        }
        if (user.event !== undefined) {
            types[type].events.push(user.event);
        }
        if (user.struct !== undefined) {
            types[type].structs.push(user.struct);
        }
    };
    for (const contract of Object.values(docs.contracts)) {
        for (const [typeName, doc] of Object.entries(contract.structs)) {
            for (const field of Object.values(doc.fields)) {
                addTypeUser(field.type, { struct: typeName });
            }
        }
        for (const doc of contract.events) {
            for (const param of Object.values(doc.parameters)) {
                addTypeUser(param.type, { event: doc });
            }
        }
        for (const doc of contract.methods) {
            for (const param of Object.values(doc.parameters)) {
                addTypeUser(param.type, { method: doc });
            }
            for (const param of Object.values(doc.returns)) {
                addTypeUser(param.type, { method: doc });
            }
        }
    }
    return types;
}

function isTypeUsedByContracts(
    type: string,
    usages: TypesUsage,
    contracts: string[],
    onlyExposed: boolean = false,
): boolean {
    const usage = usages[type];
    if (usage === undefined) {
        return false;
    }
    for (const struct of usage.structs) {
        if (isTypeUsedByContracts(struct, usages, contracts, onlyExposed)) {
            return true;
        }
    }
    if (usage.events.some(e => contracts.includes(e.contract))) {
        return true;
    }
    if (usage.methods
            .filter(m => !onlyExposed || isMethodVisible(m))
            .some(m => contracts.includes(m.contract))) {
        return true;
    }
    return false;
}

function isMethodVisible(method: ContractMethodDocs): boolean {
    const VISIBLES = ['external', 'public'];
    return VISIBLES.includes(method.visibility);
}
