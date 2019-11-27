import { DevUtilsContract } from '@0x/contract-wrappers';
import { NULL_ADDRESS } from '@0x/utils';

const fakeProvider = { isEIP1193: true } as any;
export const devUtilsContract = new DevUtilsContract(NULL_ADDRESS, fakeProvider);
