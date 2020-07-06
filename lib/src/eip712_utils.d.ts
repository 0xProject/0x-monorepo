import { EIP712DomainWithDefaultSchema, EIP712Object, EIP712TypedData, EIP712Types, Order, SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
export declare const eip712Utils: {
    /**
     * Creates a EIP712TypedData object specific to the 0x protocol for use with signTypedData.
     * @param   primaryType The primary type found in message
     * @param   types The additional types for the data in message
     * @param   message The contents of the message
     * @param   domain Domain containing a name (optional), version (optional), and verifying contract address
     * @return  A typed data object
     */
    createTypedData: (primaryType: string, types: EIP712Types, message: EIP712Object, domain: EIP712DomainWithDefaultSchema) => EIP712TypedData;
    /**
     * Creates an Order EIP712TypedData object for use with signTypedData.
     * @param   Order the order
     * @return  A typed data object
     */
    createOrderTypedData: (order: Order) => EIP712TypedData;
    /**
     * Creates an ExecuteTransaction EIP712TypedData object for use with signTypedData and
     * 0x Exchange executeTransaction.
     * @param   zeroExTransaction the 0x transaction
     * @return  A typed data object
     */
    createZeroExTransactionTypedData: (zeroExTransaction: ZeroExTransaction) => EIP712TypedData;
    /**
     * Creates an Coordinator typedData EIP712TypedData object for use with the Coordinator extension contract
     * @param   transaction A 0x transaction
     * @param   verifyingContract The coordinator extension contract address that will be verifying the typedData
     * @param   txOrigin The desired `tx.origin` that should be able to submit an Ethereum txn involving this 0x transaction
     * @return  A typed data object
     */
    createCoordinatorApprovalTypedData(transaction: SignedZeroExTransaction, verifyingContract: string, txOrigin: string): EIP712TypedData;
};
//# sourceMappingURL=eip712_utils.d.ts.map