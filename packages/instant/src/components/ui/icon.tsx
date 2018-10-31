import * as React from 'react';

type svgRule = 'evenodd' | 'nonzero' | 'inherit';
interface IconInfo {
    viewBox: string;
    path: string;
    fillRule?: svgRule;
    clipRule?: svgRule;
    stroke?: string;
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
        stroke: 'white',
        strokeOpacity: 0.5,
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    },
};

export interface IconProps {
    width: number;
    height?: number;
    color?: string;
    icon: keyof IconInfoMapping;
}
export const Icon: React.SFC<IconProps> = props => {
    const iconInfo = ICONS[props.icon];

    return (
        <svg
            width={props.width}
            height={props.height}
            viewBox={iconInfo.viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d={iconInfo.path}
                fill={props.color}
                fillRule={iconInfo.fillRule || 'nonzero'}
                clipRule={iconInfo.clipRule || 'nonzero'}
                stroke={iconInfo.stroke}
                strokeOpacity={iconInfo.strokeOpacity}
                strokeWidth={iconInfo.strokeWidth}
                strokeLinecap={iconInfo.strokeLinecap}
                strokeLinejoin={iconInfo.strokeLinejoin}
            />
        </svg>
    );
};
