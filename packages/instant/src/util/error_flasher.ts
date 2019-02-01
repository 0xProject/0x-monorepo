import { Dispatch } from 'redux';

import { Action, actions } from '../redux/actions';

class ErrorFlasher {
    private _timeoutId?: number;
    public flashNewErrorMessage(dispatch: Dispatch<Action>, errorMessage?: string, delayMs: number = 7000): void {
        this._clearTimeout();
        // dispatch new message
        dispatch(actions.setErrorMessage(errorMessage || 'Something went wrong...'));
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
