import styled from 'styled-components';
import { colors } from '../variables';

import { withContext, Props } from './withContext';

interface ButtonProps extends Props {
    large?: boolean;
}

const Button =
    styled.button <
    ButtonProps >
    `
  font-family: inherit;
  font-size: ${props => (props.large ? '1.125rem' : '.875rem')};
  font-weight: 500;
  white-space: nowrap;
  vertical-align: middle;
  background-color: ${props => props.colors.secondary};
  color: ${colors.black};
  border: 0;
  border-radius: 5rem;
  padding: ${props => (props.large ? '1.125rem 2.375rem' : '.5625rem 1.25rem')};
  display: inline-block;
`;

export default withContext(Button);
