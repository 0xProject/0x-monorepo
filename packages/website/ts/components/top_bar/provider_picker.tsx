import { colors, constants as sharedConstants } from '@0xproject/react-shared';
import * as _ from 'lodash';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ProviderType } from 'ts/types';
import { constants } from 'ts/utils/constants';

interface ProviderPickerProps {
    networkId: number;
    injectedProviderName: string;
    providerType: ProviderType;
    onToggleLedgerDialog: () => void;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
}

interface ProviderPickerState {}

export class ProviderPicker extends React.Component<ProviderPickerProps, ProviderPickerState> {
    public render(): React.ReactNode {
        const isLedgerSelected = this.props.providerType === ProviderType.Ledger;
        const menuStyle = {
            padding: 10,
            paddingTop: 15,
            paddingBottom: 15,
        };
        // Show dropdown with two options
        return (
            <div style={{ width: 225, overflow: 'hidden' }}>
                <RadioButtonGroup name="provider" defaultSelected={this.props.providerType}>
                    <RadioButton
                        onClick={this._onProviderRadioChanged.bind(this, ProviderType.Injected)}
                        style={{ ...menuStyle, backgroundColor: !isLedgerSelected && colors.grey50 }}
                        value={ProviderType.Injected}
                        label={this._renderLabel(this.props.injectedProviderName, !isLedgerSelected)}
                    />
                    <RadioButton
                        onClick={this._onProviderRadioChanged.bind(this, ProviderType.Ledger)}
                        style={{ ...menuStyle, backgroundColor: isLedgerSelected && colors.grey50 }}
                        value={ProviderType.Ledger}
                        label={this._renderLabel('Ledger Nano S', isLedgerSelected)}
                    />
                </RadioButtonGroup>
            </div>
        );
    }
    private _renderLabel(title: string, shouldShowNetwork: boolean): React.ReactNode {
        const label = (
            <div className="flex">
                <div style={{ fontSize: 14 }}>{title}</div>
                {shouldShowNetwork && this._renderNetwork()}
            </div>
        );
        return label;
    }
    private _renderNetwork(): React.ReactNode {
        const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
        return (
            <div className="flex" style={{ marginTop: 1 }}>
                <div className="relative" style={{ width: 14, paddingLeft: 14 }}>
                    <img
                        src={`/images/network_icons/${networkName.toLowerCase()}.png`}
                        className="absolute"
                        style={{ top: 6, width: 10 }}
                    />
                </div>
                <div style={{ color: colors.lightGrey, fontSize: 11 }}>{networkName}</div>
            </div>
        );
    }
    private _onProviderRadioChanged(value: string): void {
        if (value === ProviderType.Ledger) {
            this.props.onToggleLedgerDialog();
        } else {
            // tslint:disable-next-line:no-floating-promises
            this.props.blockchain.updateProviderToInjectedAsync();
        }
    }
}
