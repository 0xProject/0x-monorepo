import { JSONRPCRequestPayload } from 'ethereum-types';

export type ErrorCallback = (err: Error | null, data?: any) => void;
export type Callback = () => void;
export type OnNextCompleted = (err: Error | null, result: any, cb: Callback) => void;
export type NextCallback = (callback?: OnNextCompleted) => void;
export interface JSONRPCRequestPayloadWithMethod extends JSONRPCRequestPayload {
    method: string;
}
