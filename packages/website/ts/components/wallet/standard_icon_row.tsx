import * as React from 'react';

import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

export interface StandardIconRowProps {
    className?: string;
    icon: React.ReactNode;
    main: React.ReactNode;
    accessory?: React.ReactNode;
    minHeight?: string;
    borderBottomColor?: string;
    borderBottomStyle?: string;
    borderWidth?: string;
    backgroundColor?: string;
}
const PlainStandardIconRow: React.StatelessComponent<StandardIconRowProps> = ({ className, icon, main, accessory }) => {
    return (
        <div className={`flex items-center ${className}`}>
            <div className="flex items-center px2">{icon}</div>
            <div className="flex-none pr2">{main}</div>
            <div className="flex-auto" />
            <div>{accessory}</div>
        </div>
    );
};

export const StandardIconRow = styled(PlainStandardIconRow)`
    min-height: ${props => props.minHeight};
    border-bottom-color: ${props => props.borderBottomColor};
    border-bottom-style: ${props => props.borderBottomStyle};
    border-width: ${props => props.borderWidth};
    background-color: ${props => props.backgroundColor};
`;

StandardIconRow.defaultProps = {
    minHeight: '85px',
    borderBottomColor: colors.walletBorder,
    borderBottomStyle: 'solid',
    borderWidth: '1px',
    backgroundColor: colors.walletDefaultItemBackground,
};

StandardIconRow.displayName = 'StandardIconRow';
