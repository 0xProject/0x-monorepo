import * as _ from 'lodash';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';

interface VersionDropDownProps {
    selectedVersion: string;
    versions: string[];
}

interface VersionDropDownState {}

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
        const port = window.location.port;
        const hasPort = !_.isUndefined(port);
        let path = window.location.pathname;
        const lastChar = path[path.length - 1];
        if (_.isFinite(_.parseInt(lastChar))) {
            const pathSections = path.split('/');
            pathSections.pop();
            path = pathSections.join('/');
        }
        const baseUrl = `https://${window.location.hostname}${hasPort ? `:${port}` : ''}${path}`;
        window.location.href = `${baseUrl}/${semver}${window.location.hash}`;
    }
}
