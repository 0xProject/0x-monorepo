import { styled } from '../../style/theme';

export interface CircleProps {
    diameter: number;
    fillColor?: string;
}

export const Circle =
    styled.div <
    CircleProps >
    `
    width: ${props => props.diameter}px;
    height: ${props => props.diameter}px;
    background-color: ${props => props.fillColor};
    border-radius: 50%;
`;

Circle.displayName = 'Circle';

Circle.defaultProps = {
    fillColor: 'white',
};
