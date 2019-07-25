import { darken, saturate } from 'polished';
import * as React from 'react';
import { styled } from 'ts/style/theme';
import { colors } from 'ts/utils/colors';

export interface ButtonProps {
    className?: string;
    fontSize?: string;
    fontColor?: string;
    fontFamily?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    width?: string;
    padding?: string;
    type?: string;
    isDisabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    textAlign?: string;
}

const PlainButton: React.StatelessComponent<ButtonProps> = ({ children, isDisabled, onClick, type, className }) => (
    <button type={type} className={className} onClick={isDisabled ? undefined : onClick} disabled={isDisabled}>
        {children}
    </button>
);

export const Button = styled(PlainButton)`
    cursor: ${props => (props.isDisabled ? 'default' : 'pointer')};
    font-size: ${props => props.fontSize};
    color: ${props => props.fontColor};
    transition: background-color, opacity 0.5s ease;
    padding: ${props => props.padding};
    border-radius: ${props => props.borderRadius};
    font-weight: 500;
    outline: none;
    font-family: ${props => props.fontFamily};
    width: ${props => props.width};
    text-align: ${props => props.textAlign};
    background-color: ${props => props.backgroundColor};
    border: ${props => (props.borderColor ? `1px solid ${props.borderColor}` : 'none')};
    &:hover {
        background-color: ${props => (!props.isDisabled ? darken(0.1, props.backgroundColor) : '')} !important;
    }
    &:active {
        background-color: ${props => (!props.isDisabled ? darken(0.2, props.backgroundColor) : '')};
    }
    &:disabled {
        opacity: 0.5;
    }
    &:focus {
        background-color: ${props => saturate(0.2, props.backgroundColor)};
    }
`;

Button.defaultProps = {
    fontSize: '12px',
    borderRadius: '6px',
    backgroundColor: colors.white,
    width: 'auto',
    fontFamily: 'Roboto',
    isDisabled: false,
    padding: '0.8em 2.2em',
    textAlign: 'center',
};

Button.displayName = 'Button';

type CallToActionType = 'light' | 'dark';

export interface CallToActionProps {
    type?: CallToActionType;
    fontSize?: string;
    width?: string;
    padding?: string;
}

export const CallToAction: React.StatelessComponent<CallToActionProps> = ({
    children,
    type,
    fontSize,
    padding,
    width,
}) => {
    const isLight = type === 'light';
    const backgroundColor = isLight ? colors.white : colors.mediumBlue;
    const fontColor = isLight ? colors.heroGrey : colors.white;
    return (
        <Button
            fontSize={fontSize}
            padding={padding}
            backgroundColor={backgroundColor}
            fontColor={fontColor}
            width={width}
        >
            {children}
        </Button>
    );
};

CallToAction.defaultProps = {
    type: 'dark',
    fontSize: '14px',
    padding: '0.9em 1.6em',
};
