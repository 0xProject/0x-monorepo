import * as React from 'react';

import { colors } from 'ts/utils/colors';

export interface CheckMarkProps {
    color?: string;
    isChecked?: boolean;
}

export const CheckMark: React.StatelessComponent<CheckMarkProps> = ({ color, isChecked }) => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
            cx="8.5"
            cy="8.5"
            r="8.5"
            fill={isChecked ? color : 'white'}
            stroke={isChecked ? undefined : '#CCCCCC'}
        />
        <path
            d="M2.5 4.5L1.79289 5.20711L2.5 5.91421L3.20711 5.20711L2.5 4.5ZM-0.707107 2.70711L1.79289 5.20711L3.20711 3.79289L0.707107 1.29289L-0.707107 2.70711ZM3.20711 5.20711L7.70711 0.707107L6.29289 -0.707107L1.79289 3.79289L3.20711 5.20711Z"
            transform="translate(5 6.5)"
            fill="white"
        />
    </svg>
);

CheckMark.displayName = 'Check';

CheckMark.defaultProps = {
    color: colors.mediumBlue,
};
