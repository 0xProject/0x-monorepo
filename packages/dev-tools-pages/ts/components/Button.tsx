import styled from 'styled-components';
import { colors } from '../variables';

import { media } from 'ts/variables';
import { withContext, Props } from './withContext';

interface ButtonProps extends Props {
    large?: boolean;
}

const Button =
    styled.button <
    ButtonProps >
    `
  font-family: inherit;
  line-height: 1;
  font-weight: 500;
  white-space: nowrap;
  vertical-align: middle;
  background-color: ${props => props.colors.secondary};
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
    background-color: ${props => props.colors.secondary_alt};
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

export default withContext(Button);
