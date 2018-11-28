import * as React from 'react';
import styled from 'styled-components';

interface ContainerProps {
  bgColor?: string;
  removePadding?: boolean;
}

const StyledContainer = styled.div<ContainerProps>`
    background-color: ${props => props.bgColor || 'transparent'};
    max-width: 117rem; // 2000px
    margin: 0 auto;
    padding: 0 1.764705882rem; // 30px

    ${props => props.removePadding && `padding: 0;`}
`;

export const Container: React.StatelessComponent<ContainerProps> = props => {
  const { children } = props;

  return (
    <StyledContainer {...props}>
      {children}
    </StyledContainer>
  );
};
