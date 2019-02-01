import * as _ from 'lodash';
import Snackbar from 'material-ui/Snackbar';
import * as React from 'react';
import { Dispatcher } from 'ts/redux/dispatcher';

const SHOW_DURATION_MS = 4000;

interface FlashMessageProps {
    dispatcher: Dispatcher;
    flashMessage?: string | React.ReactNode;
    showDurationMs?: number;
    bodyStyle?: React.CSSProperties;
}

interface FlashMessageState {}

export class FlashMessage extends React.Component<FlashMessageProps, FlashMessageState> {
    public static defaultProps: Partial<FlashMessageProps> = {
        showDurationMs: SHOW_DURATION_MS,
        bodyStyle: {},
    };
    public render(): React.ReactNode {
        if (!_.isUndefined(this.props.flashMessage)) {
            return (
                <Snackbar
                    open={true}
                    message={this.props.flashMessage}
                    autoHideDuration={this.props.showDurationMs}
                    onRequestClose={this._onClose.bind(this)}
                    bodyStyle={this.props.bodyStyle}
                />
            );
        } else {
            return null;
        }
    }
    private _onClose(): void {
        this.props.dispatcher.hideFlashMessage();
    }
}
