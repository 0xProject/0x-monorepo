import { ColorOption, styled, Theme, withTheme } from '../../style/theme';

export interface CircleProps {
    diameter: number;
    rawColor?: string;
    color?: ColorOption;
    theme: Theme;
}

export const Circle = withTheme(
    styled.div <
        CircleProps >
        `
    && {
        width: ${props => props.diameter}px;
        height: ${props => props.diameter}px;
        background-color: ${props => (props.rawColor ? props.rawColor : props.theme[props.color || ColorOption.white])};
        border-radius: 50%;
    }
`,
);

Circle.displayName = 'Circle';

Circle.defaultProps = {
    color: ColorOption.white,
};
