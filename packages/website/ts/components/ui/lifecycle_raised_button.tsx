import * as _ from 'lodash';
import * as React from 'react';
import {utils} from 'ts/utils/utils';
import {Token} from 'ts/types';
import {Blockchain} from 'ts/blockchain';
import RaisedButton from 'material-ui/RaisedButton';

const COMPLETE_STATE_SHOW_LENGTH_MS = 2000;

enum ButtonState {
  READY,
  LOADING,
  COMPLETE,
};

interface LifeCycleRaisedButtonProps {
    isHidden?: boolean;
    isDisabled?: boolean;
    isPrimary?: boolean;
    labelReady: React.ReactNode|string;
    labelLoading: React.ReactNode|string;
    labelComplete: React.ReactNode|string;
    onClickAsyncFn: () => boolean;
    backgroundColor?: string;
    labelColor?: string;
}

interface LifeCycleRaisedButtonState {
    buttonState: ButtonState;
}

export class LifeCycleRaisedButton extends
    React.Component<LifeCycleRaisedButtonProps, LifeCycleRaisedButtonState> {
    public static defaultProps: Partial<LifeCycleRaisedButtonProps> = {
        isDisabled: false,
        backgroundColor: 'white',
        labelColor: 'rgb(97, 97, 97)',
    };
    private buttonTimeoutId: number;
    private didUnmount: boolean;
    constructor(props: LifeCycleRaisedButtonProps) {
        super(props);
        this.state = {
            buttonState: ButtonState.READY,
        };
    }
    public componentWillUnmount() {
        clearTimeout(this.buttonTimeoutId);
        this.didUnmount = true;
    }
    public render() {
        if (this.props.isHidden === true) {
            return <span />;
        }

        let label;
        switch (this.state.buttonState) {
            case ButtonState.READY:
                label = this.props.labelReady;
                break;
            case ButtonState.LOADING:
                label = this.props.labelLoading;
                break;
            case ButtonState.COMPLETE:
                label = this.props.labelComplete;
                break;
            default:
                throw utils.spawnSwitchErr('ButtonState', this.state.buttonState);
        }
        return (
            <RaisedButton
                primary={this.props.isPrimary}
                label={label}
                style={{width: '100%'}}
                backgroundColor={this.props.backgroundColor}
                labelColor={this.props.labelColor}
                onTouchTap={this.onClickAsync.bind(this)}
                disabled={this.props.isDisabled || this.state.buttonState !== ButtonState.READY}
            />
        );
    }
    public async onClickAsync() {
        this.setState({
            buttonState: ButtonState.LOADING,
        });
        const didSucceed = await this.props.onClickAsyncFn();
        if (this.didUnmount) {
            return; // noop since unmount called before async callback returned.
        }
        if (didSucceed) {
            this.setState({
                buttonState: ButtonState.COMPLETE,
            });
            this.buttonTimeoutId = window.setTimeout(() => {
                this.setState({
                    buttonState: ButtonState.READY,
                });
            }, COMPLETE_STATE_SHOW_LENGTH_MS);
        } else {
            this.setState({
                buttonState: ButtonState.READY,
            });
        }
    }
}
