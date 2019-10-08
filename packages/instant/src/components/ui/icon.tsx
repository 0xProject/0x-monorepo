import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption, styled, Theme, withTheme } from '../../style/theme';

type svgRule = 'evenodd' | 'nonzero' | 'inherit';
interface IconInfo {
    viewBox: string;
    path: string;
    fillRule?: svgRule;
    clipRule?: svgRule;
    strokeOpacity?: number;
    strokeWidth?: number;
    strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
    strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
}
interface IconInfoMapping {
    closeX: IconInfo;
    failed: IconInfo;
    success: IconInfo;
    chevron: IconInfo;
    chevronRight: IconInfo;
    search: IconInfo;
    lock: IconInfo;
}
const ICONS: IconInfoMapping = {
    closeX: {
        viewBox: '0 0 11 11',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        path:
            'M10.45 10.449C10.7539 10.1453 10.7539 9.65282 10.45 9.34909L6.60068 5.49999L10.45 1.65093C10.7538 1.3472 10.7538 0.854765 10.45 0.551038C10.1462 0.24731 9.65378 0.24731 9.34995 0.551038L5.50058 4.40006L1.65024 0.549939C1.34641 0.246212 0.853973 0.246212 0.550262 0.549939C0.246429 0.853667 0.246429 1.34611 0.550262 1.64983L4.40073 5.49995L0.55014 9.35019C0.246307 9.65392 0.246307 10.1464 0.55014 10.4501C0.853851 10.7538 1.34628 10.7538 1.65012 10.4501L5.5007 6.59987L9.35007 10.449C9.6539 10.7527 10.1463 10.7527 10.45 10.449Z',
    },
    failed: {
        viewBox: '0 0 34 34',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        path:
            'M6.65771 26.4362C9.21777 29.2406 12.9033 31 17 31C24.7319 31 31 24.7319 31 17C31 14.4468 30.3164 12.0531 29.1226 9.99219L6.65771 26.4362ZM4.88281 24.0173C3.68555 21.9542 3 19.5571 3 17C3 9.26807 9.26807 3 17 3C21.1006 3 24.7891 4.76294 27.3496 7.57214L4.88281 24.0173ZM0 17C0 26.3888 7.61133 34 17 34C26.3887 34 34 26.3888 34 17C34 7.61121 26.3887 0 17 0C7.61133 0 0 7.61121 0 17Z',
    },
    success: {
        viewBox: '0 0 34 34',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        path:
            'M17 34C26.3887 34 34 26.3888 34 17C34 7.61121 26.3887 0 17 0C7.61133 0 0 7.61121 0 17C0 26.3888 7.61133 34 17 34ZM25.7539 13.0977C26.2969 12.4718 26.2295 11.5244 25.6035 10.9817C24.9775 10.439 24.0303 10.5063 23.4878 11.1323L15.731 20.0771L12.3936 16.7438C11.8071 16.1583 10.8574 16.1589 10.272 16.7451C9.68652 17.3313 9.6875 18.281 10.2734 18.8665L14.75 23.3373L15.8887 24.4746L16.9434 23.2587L25.7539 13.0977Z',
    },
    chevron: {
        viewBox: '0 0 12 7',
        path: 'M11 1L6 6L1 1',
        strokeOpacity: 0.5,
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    },
    chevronRight: {
        viewBox: '0 0 7 13',
        path: 'M1 1.5L6 6.5L1 11.5',
        strokeOpacity: 0.5,
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    },
    search: {
        viewBox: '0 0 14 14',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        path:
            'M8.39404 5.19727C8.39404 6.96289 6.96265 8.39453 5.19702 8.39453C3.4314 8.39453 2 6.96289 2 5.19727C2 3.43164 3.4314 2 5.19702 2C6.96265 2 8.39404 3.43164 8.39404 5.19727ZM8.09668 9.51074C7.26855 10.0684 6.27075 10.3945 5.19702 10.3945C2.3269 10.3945 0 8.06738 0 5.19727C0 2.32715 2.3269 0 5.19702 0C8.06738 0 10.394 2.32715 10.394 5.19727C10.394 6.27051 10.0686 7.26855 9.51074 8.09668L13.6997 12.2861L12.2854 13.7002L8.09668 9.51074Z',
    },
    lock: {
        viewBox: '0 0 13 16',
        path:
            'M6.47619 0C3.79509 0 1.60489 2.21216 1.60489 4.92014V6.33135C0.717479 6.33135 0 7.05602 0 7.95232V14.379C0 15.2753 0.717479 16 1.60489 16H11.3475C12.2349 16 12.9524 15.2753 12.9524 14.379V7.95232C12.9524 7.05602 12.2349 6.33135 11.3475 6.33135V4.92014C11.3475 2.21216 9.1573 0 6.47619 0ZM9.6482 6.33135H3.30418V4.92014C3.30418 3.16567 4.72026 1.71633 6.47619 1.71633C8.23213 1.71633 9.6482 3.16567 9.6482 4.92014V6.33135Z',
    },
};

export interface IconProps {
    className?: string;
    width: number;
    height?: number;
    color?: ColorOption;
    stroke?: ColorOption;
    icon: keyof IconInfoMapping;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    padding?: string;
    theme: Theme;
}
const PlainIcon: React.StatelessComponent<IconProps> = props => {
    const iconInfo = ICONS[props.icon];
    const colorValue = props.color === undefined ? undefined : props.theme[props.color];
    const strokeValue = props.stroke === undefined ? undefined : props.theme[props.stroke];
    return (
        <div onClick={props.onClick} className={props.className}>
            <svg
                width={props.width}
                height={props.height}
                viewBox={iconInfo.viewBox}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke={props.stroke}
            >
                <path
                    d={iconInfo.path}
                    fill={colorValue}
                    fillRule={iconInfo.fillRule || 'nonzero'}
                    clipRule={iconInfo.clipRule || 'nonzero'}
                    stroke={strokeValue}
                    strokeOpacity={iconInfo.strokeOpacity}
                    strokeWidth={iconInfo.strokeWidth}
                    strokeLinecap={iconInfo.strokeLinecap}
                    strokeLinejoin={iconInfo.strokeLinejoin}
                />
            </svg>
        </div>
    );
};

export const Icon = withTheme(styled(PlainIcon)`
    && {
        display: inline-block;
        ${props => (props.onClick !== undefined ? 'cursor: pointer' : '')};
        transition: opacity 0.5s ease;
        padding: ${props => props.padding};
        opacity: ${props => (props.onClick !== undefined ? 0.7 : 1)};
        &:hover {
            opacity: 1;
        }
        &:active {
            opacity: 1;
        }
    }
`);

Icon.defaultProps = {
    padding: '0em 0em',
};

Icon.displayName = 'Icon';
