import { constants as sharedConstants } from '@0x/react-shared';
import * as _ from 'lodash';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';

interface NetworkDropDownProps {
    updateSelectedNetwork: (e: any, index: number, value: number) => void;
    selectedNetworkId: number;
    avialableNetworkIds: number[];
}

interface NetworkDropDownState {}

export class NetworkDropDown extends React.Component<NetworkDropDownProps, NetworkDropDownState> {
    public render(): React.ReactNode {
        return (
            <div className="mx-auto" style={{ width: 120 }}>
                <DropDownMenu value={this.props.selectedNetworkId} onChange={this.props.updateSelectedNetwork}>
                    {this._renderDropDownItems()}
                </DropDownMenu>
            </div>
        );
    }
    private _renderDropDownItems(): React.ReactNode {
        const items = _.map(this.props.avialableNetworkIds, networkId => {
            const networkName = sharedConstants.NETWORK_NAME_BY_ID[networkId];
            const primaryText = (
                <div className="flex">
                    <div className="pr1" style={{ width: 14, paddingTop: 2 }}>
                        <img src={`/images/network_icons/${networkName.toLowerCase()}.png`} style={{ width: 14 }} />
                    </div>
                    <div>{networkName}</div>
                </div>
            );
            return <MenuItem key={networkId} value={networkId} primaryText={primaryText} />;
        });
        return items;
    }
}
