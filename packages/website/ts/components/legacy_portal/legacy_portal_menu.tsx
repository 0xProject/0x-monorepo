import * as _ from 'lodash';
import * as React from 'react';
import { MenuItem } from 'ts/components/ui/menu_item';
import { Environments, WebsitePaths } from 'ts/types';
import { configs } from 'ts/utils/configs';

export interface LegacyPortalMenuProps {
    menuItemStyle: React.CSSProperties;
    onClick?: () => void;
}

interface LegacyPortalMenuState {}

export class LegacyPortalMenu extends React.Component<LegacyPortalMenuProps, LegacyPortalMenuState> {
    public static defaultProps: Partial<LegacyPortalMenuProps> = {
        onClick: _.noop,
    };
    public render(): React.ReactNode {
        return (
            <div>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this._renderMenuItemWithIcon('Generate order', 'zmdi-arrow-right-top')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/fill`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this._renderMenuItemWithIcon('Fill order', 'zmdi-arrow-left-bottom')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/balances`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this._renderMenuItemWithIcon('Balances', 'zmdi-balance-wallet')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/trades`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this._renderMenuItemWithIcon('Trade history', 'zmdi-format-list-bulleted')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/weth`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this._renderMenuItemWithIcon('Wrap ETH', 'zmdi-circle-o')}
                </MenuItem>
            </div>
        );
    }
    private _renderMenuItemWithIcon(title: string, iconName: string): React.ReactNode {
        return (
            <div className="flex" style={{ fontWeight: 100 }}>
                <div className="pr1 pl2">
                    <i style={{ fontSize: 20 }} className={`zmdi ${iconName}`} />
                </div>
                <div className="pl1">{title}</div>
            </div>
        );
    }
}
