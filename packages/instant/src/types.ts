export enum ActionTypes {
    UPDATE_ETH_USD_PRICE,
}

export interface Action {
    type: ActionTypes;
    data?: any;
}
