// Reusable
export enum AsyncProcessState {
    NONE,
    PENDING,
    SUCCESS,
    FAILURE,
}

export enum ActionTypes {
    UPDATE_ETH_USD_PRICE,
    UPDATE_SELECTED_ASSET_AMOUNT,
    UPDATE_SELECTED_ASSET_BUY_STATE,
    UPDATE_LATEST_BUY_QUOTE,
}

export interface Action {
    type: ActionTypes;
    data?: any;
}
