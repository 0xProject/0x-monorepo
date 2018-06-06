import { Styles } from '@0xproject/react-shared';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { colors } from 'ts/style/colors';

export interface BackButtonProps {
    to: string;
    labelText: string;
}

const BACK_BUTTON_HEIGHT = 28;

const styles: Styles = {
    backButton: {
        height: BACK_BUTTON_HEIGHT,
        paddingTop: 10,
        backgroundColor: colors.white,
        borderRadius: BACK_BUTTON_HEIGHT,
        boxShadow: `0px 4px 6px ${colors.walletBoxShadow}`,
    },
    backButtonIcon: {
        color: colors.mediumBlue,
        fontSize: 20,
    },
};

export const BackButton = (props: BackButtonProps) => {
    return (
        <div style={{ height: 65, paddingTop: 25 }}>
            <Link to={props.to} style={{ textDecoration: 'none' }}>
                <div className="flex right" style={styles.backButton}>
                    <div style={{ marginLeft: 12 }}>
                        <i style={styles.backButtonIcon} className={`zmdi zmdi-arrow-left`} />
                    </div>
                    <div style={{ marginLeft: 12, marginRight: 12 }}>
                        <div style={{ fontSize: 16, color: colors.lightGrey }}>{props.labelText}</div>
                    </div>
                </div>
            </Link>
        </div>
    );
};
