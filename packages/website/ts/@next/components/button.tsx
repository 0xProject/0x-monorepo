import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface ButtonInterface {
    transparent?: boolean;
    inline?: boolean;
    href?: string;
    onClick?: () => void;
}

const StyledButton = styled.button<ButtonInterface>`
    appearance: none;
    border: 0;
    background-color: ${colors.brandLight};
    border: 1px solid ${colors.brandLight};
    color: ${colors.white};
    text-align: center;
    padding: 13px 22px 14px;
    text-decoration: none;

    ${props => props.transparent && `
        background-color: transparent;
        border-color: #6A6A6A;
    `}

    ${props => props.inline && `
        display: inline-block;
        & + & {
            margin-left: 10px;
        }
    `}
`;

// A button that may exist as a button or a link
// a button only makes sense with an onClick handler
// a link with an href so we base the type of component we return
// based on those props

export const Button: React.StatelessComponent<ButtonInterface> = props => {
  const { onClick, href } = props;
  const Component = onClick ? StyledButton : StyledButton.withComponent('a');

  return <Component {...props}>{props.children}</Component>;
};

// usage
// <Button href="#">Text</Button> ===> <a href="">Text</a>
// <Button onClick={() => func}>I'm a button</Button> ====> <button></button>

// export const Button: React.StatelessComponent<ButtonInterface> = ({ ...props }) => (
//     <StyledButton {...props}>
//         <Text>{props.text}</Text>
//     </StyledButton>
// );

// also feel like a transparent prop would suffice instead of having a separate button
// so we have the logic with the Link/button--- and props = styling. in this case:
// background-color: ${props => !props.transparent && 'somecolor'}..
export const ButtonTransparent: React.StatelessComponent<ButtonInterface> = ({ ...props }) => (
    <Button transparent={true} {...props}>{props.children}</Button>
);

Button.defaultProps = {
    transparent: false,
    inline: false,
};
