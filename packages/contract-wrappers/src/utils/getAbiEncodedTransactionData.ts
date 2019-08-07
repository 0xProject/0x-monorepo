import { ExchangeContract } from '../index';

// HACK (xianny): we haven't formalised contract method functions into a type interface, and would have to
//      differentiate contract method members from other class members to get this to work non-hackily

export function getAbiEncodedTransactionData<K extends keyof ExchangeContract>(contractInstance: ExchangeContract, methodName: K, ...params: any): string {
    const method = (contractInstance[methodName] as any) as {
        getAbiEncodedTransactionData: (...args: any) => string;
    };
    if (method.getAbiEncodedTransactionData) {
        const abiEncodedData = method.getAbiEncodedTransactionData(params);
        return abiEncodedData;
    } else {
        return '';
    }
}
