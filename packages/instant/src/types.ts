export enum ActionTypes {
    UPDATE_ETH_USD_PRICE,
    UPDATE_SELECTED_ASSET_AMOUNT,
}

export interface Action {
    type: ActionTypes;
    data?: any;
}
