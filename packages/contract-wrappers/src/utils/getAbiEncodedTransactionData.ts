import { ExchangeContract } from '../index';

/**
 * Returns the ABI encoded transaction hash for a given method and arguments
 * @param methodName Must be a valid name of a function in the Solidity Exchange Contract
 * @param params The appropriate arguments for the method given, in order
 */
export function getAbiEncodedTransactionData<K extends keyof ExchangeContract>(
    contractInstance: ExchangeContract,
    methodName: K,
    ...params: any[] // tslint:disable-line:trailing-comma
): string {
    // HACK (xianny): we haven't formalised contract method functions into a type interface, and would have to
    //      differentiate contract method members from other class members to get this to work non-hackily
    const method = (contractInstance[methodName] as any) as {
        getABIEncodedTransactionData: (...args: any[]) => string;
    };
    if (method.getABIEncodedTransactionData) {
        const abiEncodedData = method.getABIEncodedTransactionData(...params);
        return abiEncodedData;
    } else {
        return '';
    }
}
