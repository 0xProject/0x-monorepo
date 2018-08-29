import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as moment from 'moment';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { TrackTokenConfirmation } from 'ts/components/track_token_confirmation';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Token, TokenByAddress } from 'ts/types';

interface TrackTokenConfirmationDialogProps {
    tokens: Token[];
    tokenByAddress: TokenByAddress;
    isOpen: boolean;
    onToggleDialog: (didConfirmTokenTracking: boolean) => void;
    dispatcher: Dispatcher;
    networkId: number;
    blockchain: Blockchain;
    userAddress: string;
}

interface TrackTokenConfirmationDialogState {
    isAddingTokenToTracked: boolean;
}

export class TrackTokenConfirmationDialog extends React.Component<
    TrackTokenConfirmationDialogProps,
    TrackTokenConfirmationDialogState
> {
    constructor(props: TrackTokenConfirmationDialogProps) {
        super(props);
        this.state = {
            isAddingTokenToTracked: false,
        };
    }
    public render(): React.ReactNode {
        const tokens = this.props.tokens;
        return (
            <Dialog
                title="Tracking confirmation"
                titleStyle={{ fontWeight: 100 }}
                actions={[
                    <FlatButton
                        key="trackNo"
                        label="No"
                        onClick={this._onTrackConfirmationRespondedAsync.bind(this, false)}
                    />,
                    <FlatButton
                        key="trackYes"
                        label="Yes"
                        onClick={this._onTrackConfirmationRespondedAsync.bind(this, true)}
                    />,
                ]}
                open={this.props.isOpen}
                onRequestClose={this.props.onToggleDialog.bind(this, false)}
                autoScrollBodyContent={true}
            >
                <div className="pt2">
                    <TrackTokenConfirmation
                        tokens={tokens}
                        networkId={this.props.networkId}
                        tokenByAddress={this.props.tokenByAddress}
                        isAddingTokenToTracked={this.state.isAddingTokenToTracked}
                    />
                </div>
            </Dialog>
        );
    }
    private async _onTrackConfirmationRespondedAsync(didUserAcceptTracking: boolean): Promise<void> {
        if (!didUserAcceptTracking) {
            this.props.onToggleDialog(didUserAcceptTracking);
            return;
        }
        this.setState({
            isAddingTokenToTracked: true,
        });
        const currentTimestamp = moment().unix();
        for (const token of this.props.tokens) {
            const newTokenEntry = {
                ...token,
                trackedTimestamp: currentTimestamp,
            };

            trackedTokenStorage.addTrackedTokenToUser(this.props.userAddress, this.props.networkId, newTokenEntry);
            this.props.dispatcher.updateTokenByAddress([newTokenEntry]);
        }

        this.setState({
            isAddingTokenToTracked: false,
        });
        this.props.onToggleDialog(didUserAcceptTracking);
    }
}
