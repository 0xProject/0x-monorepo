import * as React from 'react';
import { Link } from 'ts/components/documentation/shared/link';
import { Island } from 'ts/components/ui/island';
import { colors } from 'ts/style/colors';
import { Styles } from 'ts/types';

export interface BackButtonProps {
    to: string;
    labelText: string;
}

const BACK_BUTTON_HEIGHT = 28;

const styles: Styles = {
    backButton: {
        height: BACK_BUTTON_HEIGHT,
        paddingTop: 10,
        borderRadius: BACK_BUTTON_HEIGHT,
    },
    backButtonIcon: {
        color: colors.mediumBlue,
        fontSize: 20,
    },
};

export const BackButton = (props: BackButtonProps) => {
    return (
        <div style={{ height: 65, paddingTop: 25 }}>
            <Link to={props.to}>
                <Island className="flex right" style={styles.backButton}>
                    <div style={{ marginLeft: 12 }}>
                        <i style={styles.backButtonIcon} className={`zmdi zmdi-arrow-left`} />
                    </div>
                    <div style={{ marginLeft: 12, marginRight: 12 }}>
                        <div style={{ fontSize: 16, color: colors.mediumBlue }}>{props.labelText}</div>
                    </div>
                </Island>
            </Link>
        </div>
    );
};
