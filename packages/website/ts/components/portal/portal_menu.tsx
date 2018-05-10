import { colors, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { MenuItem } from 'ts/components/ui/menu_item';
import { Environments, WebsitePaths } from 'ts/types';
import { configs } from 'ts/utils/configs';

export interface PortalMenuProps {
    selectedPath?: string;
}

interface MenuItemEntry {
    to: string;
    labelText: string;
    iconName: string;
}

const menuItemEntries: MenuItemEntry[] = [
    {
        to: `${WebsitePaths.Portal}`,
        labelText: 'Generate order',
        iconName: 'zmdi-arrow-right-top',
    },
    {
        to: `${WebsitePaths.Portal}/fill`,
        labelText: 'Fill order',
        iconName: 'zmdi-arrow-left-bottom',
    },
    {
        to: `${WebsitePaths.Portal}/balances`,
        labelText: 'Balances',
        iconName: 'zmdi-balance-wallet',
    },
    {
        to: `${WebsitePaths.Portal}/trades`,
        labelText: 'Trade History',
        iconName: 'zmdi-format-list-bulleted',
    },
    {
        to: `${WebsitePaths.Portal}/weth`,
        labelText: 'Wrap ETH',
        iconName: 'zmdi-circle-o',
    },
];

const DEFAULT_LABEL_COLOR = colors.darkerGrey;
const DEFAULT_ICON_COLOR = colors.darkerGrey;
const SELECTED_ICON_COLOR = colors.yellow800;

export const PortalMenu: React.StatelessComponent<PortalMenuProps> = (props: PortalMenuProps) => {
    return (
        <div>
            {_.map(menuItemEntries, entry => {
                const selected = entry.to === props.selectedPath;
                return (
                    <MenuItem key={entry.to} className="py2" to={entry.to}>
                        <PortalMenuItemLabel title={entry.labelText} iconName={entry.iconName} selected={selected} />
                    </MenuItem>
                );
            })}
        </div>
    );
};

interface PortalMenuItemLabelProps {
    title: string;
    iconName: string;
    selected: boolean;
}
const PortalMenuItemLabel: React.StatelessComponent<PortalMenuItemLabelProps> = (props: PortalMenuItemLabelProps) => {
    const styles: Styles = {
        iconStyle: {
            color: props.selected ? SELECTED_ICON_COLOR : DEFAULT_ICON_COLOR,
            fontSize: 20,
        },
        textStyle: {
            color: DEFAULT_LABEL_COLOR,
            fontWeight: props.selected ? 'bold' : 'normal',
        },
    };
    return (
        <div className="flex">
            <div className="pr1 pl2">
                <i style={styles.iconStyle} className={`zmdi ${props.iconName}`} />
            </div>
            <div className="pl1" style={styles.textStyle}>
                {props.title}
            </div>
        </div>
    );
};
