import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';

class ErrorFlasher {
    private _timeoutId?: number;
    public flashNewError(dispatch: Dispatch<Action>, error: any, delayMs: number = 7000): void {
        this._clearTimeout();

        // dispatch new message
        dispatch(actions.setError(error));

        this._timeoutId = window.setTimeout(() => {
            dispatch(actions.hideError());
        }, delayMs);
    }
    public clearError(dispatch: Dispatch<Action>): void {
        this._clearTimeout();
        dispatch(actions.hideError());
    }
    private _clearTimeout(): void {
        if (this._timeoutId) {
            window.clearTimeout(this._timeoutId);
        }
    }
}
export const errorFlasher = new ErrorFlasher();
