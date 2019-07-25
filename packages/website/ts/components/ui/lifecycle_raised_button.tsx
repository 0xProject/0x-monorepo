import { errorUtils } from '@0x/utils';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import { colors } from 'ts/utils/colors';

const COMPLETE_STATE_SHOW_LENGTH_MS = 2000;

enum ButtonState {
    Ready,
    Loading,
    Complete,
}

interface LifeCycleRaisedButtonProps {
    isHidden?: boolean;
    isDisabled?: boolean;
    isPrimary?: boolean;
    labelReady: React.ReactNode | string;
    labelLoading: React.ReactNode | string;
    labelComplete: React.ReactNode | string;
    onClickAsyncFn: () => Promise<boolean>;
    backgroundColor?: string;
    labelColor?: string;
}

interface LifeCycleRaisedButtonState {
    buttonState: ButtonState;
}

export class LifeCycleRaisedButton extends React.Component<LifeCycleRaisedButtonProps, LifeCycleRaisedButtonState> {
    public static defaultProps: Partial<LifeCycleRaisedButtonProps> = {
        isDisabled: false,
        backgroundColor: colors.white,
        labelColor: colors.darkGrey,
    };
    private _buttonTimeoutId: number;
    private _didUnmount: boolean;
    constructor(props: LifeCycleRaisedButtonProps) {
        super(props);
        this.state = {
            buttonState: ButtonState.Ready,
        };
    }
    public componentWillUnmount(): void {
        clearTimeout(this._buttonTimeoutId);
        this._didUnmount = true;
    }
    public render(): React.ReactNode {
        if (this.props.isHidden) {
            return <span />;
        }

        let label;
        switch (this.state.buttonState) {
            case ButtonState.Ready:
                label = this.props.labelReady;
                break;
            case ButtonState.Loading:
                label = this.props.labelLoading;
                break;
            case ButtonState.Complete:
                label = this.props.labelComplete;
                break;
            default:
                throw errorUtils.spawnSwitchErr('ButtonState', this.state.buttonState);
        }
        return (
            <RaisedButton
                primary={this.props.isPrimary}
                label={label}
                style={{ width: '100%' }}
                backgroundColor={this.props.backgroundColor}
                labelColor={this.props.labelColor}
                onClick={this.onClickAsync.bind(this)}
                disabled={this.props.isDisabled || this.state.buttonState !== ButtonState.Ready}
            />
        );
    }
    public async onClickAsync(): Promise<void> {
        this.setState({
            buttonState: ButtonState.Loading,
        });
        const didSucceed = await this.props.onClickAsyncFn();
        if (this._didUnmount) {
            return; // noop since unmount called before async callback returned.
        }
        if (didSucceed) {
            this.setState({
                buttonState: ButtonState.Complete,
            });
            this._buttonTimeoutId = window.setTimeout(() => {
                this.setState({
                    buttonState: ButtonState.Ready,
                });
            }, COMPLETE_STATE_SHOW_LENGTH_MS);
        } else {
            this.setState({
                buttonState: ButtonState.Ready,
            });
        }
    }
}
