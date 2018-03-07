import * as _ from 'lodash';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';

import { utils } from '../utils/utils';

export interface VersionDropDownProps {
    selectedVersion: string;
    versions: string[];
    onVersionSelected: (semver: string) => void;
}

export interface VersionDropDownState {}

export class VersionDropDown extends React.Component<VersionDropDownProps, VersionDropDownState> {
    public render() {
        return (
            <div className="mx-auto" style={{ width: 120 }}>
                <DropDownMenu
                    maxHeight={300}
                    value={this.props.selectedVersion}
                    onChange={this._updateSelectedVersion.bind(this)}
                >
                    {this._renderDropDownItems()}
                </DropDownMenu>
            </div>
        );
    }
    private _renderDropDownItems() {
        const items = _.map(this.props.versions, version => {
            return <MenuItem key={version} value={version} primaryText={`v${version}`} />;
        });
        return items;
    }
    private _updateSelectedVersion(e: any, index: number, semver: string) {
        this.props.onVersionSelected(semver);
    }
}
