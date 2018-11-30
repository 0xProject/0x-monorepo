import * as React from 'react';
import styled from 'styled-components';

interface ContainerProps {
  bgColor?: string;
  removePadding?: boolean;
}


// are we still using this component? (i think not, so we should delete, but have notes)
// Also, i dont understand why create a styled comp and then make a stateless component that returns the same thing?
// should be enough to just export a styled component as it is understood that it takes props and a child
const StyledContainer = styled.div<ContainerProps>`
    background-color: ${props => props.bgColor || 'transparent'};
    max-width: 111.111111111rem; // 2000px
    margin: 0 auto;
    padding: 0 1.666666667rem; // 30px

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
