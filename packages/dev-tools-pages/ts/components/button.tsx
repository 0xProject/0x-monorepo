import styled from 'styled-components';

import { colors, media } from 'ts/variables';

interface ButtonProps {
    large?: boolean;
}

const Button = styled.button<ButtonProps>`
    font-family: inherit;
    line-height: 1;
    font-weight: 500;
    white-space: nowrap;
    vertical-align: middle;
    background-color: ${props => props.theme.colors.secondary};
    color: ${colors.black};
    border: 0;
    border-radius: 5rem;
    display: inline-flex;
    justify-content: space-between;
    align-items: center;

    ${props =>
        props.large
            ? `
      font-size: 1rem;
      padding: 1.1875rem 2.375rem 1.0625rem;
  `
            : `
      font-size: .875rem;
      padding: .5625rem 1.25rem;
  `}

    :hover, :focus {
        background-color: ${props => props.theme.colors.secondary_alt};
        outline: 0;
    }

    ${media.small`
  font-size: .875rem;
  padding: .5625rem 1.25rem;
  `}

    ${props =>
        props.large &&
        media.small`
        font-size: 1rem;
        padding: 1rem 1.5rem .75rem;
    `}
`;

export { Button };
