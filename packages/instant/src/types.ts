import { ObjectMap } from '@0xproject/types';

// Reusable
export enum AsyncProcessState {
    NONE,
    PENDING,
    SUCCESS,
    FAILURE,
}

export type FunctionType = (...args: any[]) => any;
export type ActionCreatorsMapObject = ObjectMap<FunctionType>;
export type ActionsUnion<A extends ActionCreatorsMapObject> = ReturnType<A[keyof A]>;
