import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import * as _ from 'lodash';
import * as React from 'react';

export interface VersionDropDownProps {
    selectedVersion: string;
    versions: string[];
    onVersionSelected: (semver: string) => void;
}

export interface VersionDropDownState {}

export class VersionDropDown extends React.Component<VersionDropDownProps, VersionDropDownState> {
    public render(): React.ReactNode {
        return (
            <div className="mx-auto" style={{ width: 120 }}>
                <Select value={this.props.selectedVersion} onChange={this._updateSelectedVersion.bind(this)}>
                    {this._renderDropDownItems()}
                </Select>
            </div>
        );
    }
    private _renderDropDownItems(): React.ReactNode[] {
        const items = _.map(this.props.versions, version => {
            return (
                <MenuItem key={version} value={version}>
                    v{version}
                </MenuItem>
            );
        });
        return items;
    }
    private _updateSelectedVersion(event: React.ChangeEvent<HTMLSelectElement>): void {
        this.props.onVersionSelected(event.target.value);
    }
}
