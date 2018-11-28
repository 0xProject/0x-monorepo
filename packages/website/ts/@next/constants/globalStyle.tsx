import { createGlobalStyle } from 'styled-components';
import { cssReset } from 'ts/@next/constants/cssReset';


// Not sure if cssReset is already imported into index.tsx
// Also: currently createglobalStyle from styled-components is
// throwing a warning about how there's not typing exported from styled-comps
const GlobalStyles = createGlobalStyle`
  ${cssReset};

  html {
    background-color: red;
  }
`;


export { GlobalStyles }
