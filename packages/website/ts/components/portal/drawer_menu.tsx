import { Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { defaultMenuItemEntries, Menu } from 'ts/components/portal/menu';
import { Identicon } from 'ts/components/ui/identicon';
import { WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { utils } from 'ts/utils/utils';

const IDENTICON_DIAMETER = 45;
const BORDER_RADIUS = '50%';

const styles: Styles = {
    root: {
        backgroundColor: colors.drawerMenuBackground,
        width: '100%',
        height: '100%',
    },
    identicon: {
        borderWidth: 3,
        borderStyle: 'solid',
        borderColor: colors.white,
        borderRadius: BORDER_RADIUS,
        MozBorderRadius: BORDER_RADIUS,
        WebkitBorderRadius: BORDER_RADIUS,
    },
    userAddress: {
        color: colors.white,
    },
};

export interface DrawerMenuProps {
    selectedPath?: string;
    userAddress?: string;
}
export const DrawerMenu = (props: DrawerMenuProps) => {
    const relayerItemEntry = {
        to: `${WebsitePaths.Portal}/`,
        labelText: 'Relayer ecosystem',
        iconName: 'zmdi-portable-wifi',
    };
    const menuItemEntries = _.concat(relayerItemEntry, defaultMenuItemEntries);
    return (
        <div style={styles.root}>
            <Header userAddress={props.userAddress} />
            <Menu selectedPath={props.selectedPath} menuItemEntries={menuItemEntries} />
        </div>
    );
};

interface HeaderProps {
    userAddress?: string;
}
const Header = (props: HeaderProps) => {
    return (
        <div className="flex flex-center py4">
            <div className="flex flex-column mx-auto">
                <Identicon address={props.userAddress} diameter={IDENTICON_DIAMETER} style={styles.identicon} />
                {!_.isUndefined(props.userAddress) && (
                    <div className="pt2" style={styles.userAddress}>
                        {utils.getAddressBeginAndEnd(props.userAddress)}
                    </div>
                )}
            </div>
        </div>
    );
};
