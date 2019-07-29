import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface INotificationWrapperProps {
    type?: 'standard' | 'alert' | 'success';
}

interface INotificationProps extends INotificationWrapperProps {
    children: string;
}

export const Notification: React.FC<INotificationProps> = ({ children, type = 'standard' }) => (
    <NotificationWrapper type={type}>
        {themeSettings[type].icon}
        <NotificationText>{children}</NotificationText>
    </NotificationWrapper>
);

const NotificationWrapper = styled.div<INotificationWrapperProps>`
    display: flex;
    align-items: center;
    padding: 1rem;
    margin-bottom: 1.875rem;
    color: ${colors.textDarkPrimary};
    background-color: ${({ type }) => themeSettings[type].bgColor};

    svg {
        min-width: 28px;
    }
`;

const NotificationText = styled.span`
    font-size: 1rem;
    line-height: 26px;
    margin-left: 1rem;
`;

const themeSettings = {
    success: {
        bgColor: 'rgba(0, 174, 153, 0.1)',
        icon: (
            <svg width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M14 27c7.18 0 13-5.82 13-13S21.18 1 14 1 1 6.82 1 14s5.82 13 13 13z"
                    stroke={colors.brandLight}
                    strokeWidth="1.054"
                    strokeMiterlimit="10"
                />
                <path
                    d="M14.002 26.977c7.167 0 12.977-5.81 12.977-12.976 0-7.166-5.81-12.976-12.976-12.976-7.167 0-12.977 5.81-12.977 12.976 0 7.167 5.81 12.976 12.976 12.976z"
                    stroke={colors.brandDark}
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                />
                <path d="M9 14.667L12.125 18 19 10" stroke="#003831" strokeWidth="1.5" />
            </svg>
        ),
    },
    standard: {
        bgColor: '#F2F2F2',
        icon: (
            <svg width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M14 27c7.18 0 13-5.82 13-13S21.18 1 14 1 1 6.82 1 14s5.82 13 13 13z"
                    stroke={colors.brandLight}
                    strokeWidth="1.054"
                    strokeMiterlimit="10"
                />
                <path
                    d="M14.002 26.977c7.167 0 12.977-5.81 12.977-12.976 0-7.166-5.81-12.976-12.976-12.976-7.167 0-12.977 5.81-12.977 12.976 0 7.167 5.81 12.976 12.976 12.976z"
                    stroke={colors.brandDark}
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                />
                <path
                    d="M15.298 9.494V7.641h-1.972v1.853h1.972zm-.034 1.853h-1.921V20h1.921v-8.653z"
                    fill={colors.brandDark}
                />
            </svg>
        ),
    },
    alert: {
        bgColor: '#FFFAF3',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M14.0025 26.9774C21.169 26.9774 26.9786 21.1678 26.9786 14.0013C26.9786 6.83476 21.169 1.02515 14.0025 1.02515C6.83598 1.02515 1.02637 6.83476 1.02637 14.0013C1.02637 21.1678 6.83598 26.9774 14.0025 26.9774Z"
                    stroke="#EA9928"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                />
                <path
                    d="M12.819 7.862V12.826L13.176 16.566H14.417L14.774 12.826V7.862H12.819ZM14.893 20V17.722H12.7V20H14.893Z"
                    fill="#EA9928"
                />
            </svg>
        ),
    },
};
