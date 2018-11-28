import * as React from 'react';
import styled from 'styled-components';

interface ContainerProps {
}

const StyledContainer = styled.div`
    max-width: 117rem; // 2000px
    margin: 0 auto;
    padding: 0 1.764705882rem; // 30px
`;

export const Container: React.StatelessComponent<ContainerProps> = props => {
  const { children } = props;

  return (
    <StyledContainer>
      {children}
    </StyledContainer>
  );
};
