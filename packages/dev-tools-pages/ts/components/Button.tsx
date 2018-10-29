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
  font-size: ${props => (props.large ? '1rem' : '.875rem')};
  line-height: 1;
  font-weight: 500;
  white-space: nowrap;
  vertical-align: middle;
  background-color: ${props => props.colors.secondary};
  color: ${colors.black};
  border: 0;
  border-radius: 5rem;
  height: ${props => (props.large ? '3.25rem' : '2rem')};
  padding: ${props => (props.large ? '0 2.375rem' : '0 1.25rem')};
  display: inline-flex;
  justify-content: space-between;
  align-items: center;
  :hover, :focus {
    background-color: ${props => props.colors.secondary_alt};
  } 
  ${props =>
      props.large &&
      media.small`
    font-size: .875rem;
    height: 2rem;
    padding: 0 1.25rem;
  `}
`;

export default withContext(Button);
