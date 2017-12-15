import * as _ from 'lodash';
import * as React from 'react';
import {MenuItem} from 'ts/components/ui/menu_item';
import {WebsitePaths} from 'ts/types';

export interface PortalMenuProps {
    menuItemStyle: React.CSSProperties;
    onClick?: () => void;
}

interface PortalMenuState {}

export class PortalMenu extends React.Component<PortalMenuProps, PortalMenuState> {
    public static defaultProps: Partial<PortalMenuProps> = {
        onClick: _.noop,
    };
    public render() {
        return (
            <div>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this.renderMenuItemWithIcon('Generate order', 'zmdi-arrow-right-top')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/fill`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this.renderMenuItemWithIcon('Fill order', 'zmdi-arrow-left-bottom')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/balances`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this.renderMenuItemWithIcon('Balances', 'zmdi-balance-wallet')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/trades`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this.renderMenuItemWithIcon('Trade history', 'zmdi-format-list-bulleted')}
                </MenuItem>
                <MenuItem
                    style={this.props.menuItemStyle}
                    className="py2"
                    to={`${WebsitePaths.Portal}/weth`}
                    onClick={this.props.onClick.bind(this)}
                >
                    {this.renderMenuItemWithIcon('Wrap ETH', 'zmdi-circle-o')}
                </MenuItem>
            </div>
        );
    }
    private renderMenuItemWithIcon(title: string, iconName: string) {
        return (
            <div className="flex" style={{fontWeight: 100}}>
                <div className="pr1 pl2">
                    <i style={{fontSize: 20}} className={`zmdi ${iconName}`} />
                </div>
                <div className="pl1">
                    {title}
                </div>
            </div>
        );
    }
}
