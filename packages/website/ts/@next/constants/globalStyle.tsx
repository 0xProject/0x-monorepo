import {createGlobalStyle} from 'styled-components';
import {cssReset} from 'ts/@next/constants/cssReset';
import {colors} from 'ts/style/colors';

// Not sure if cssReset is already imported into index.tsx Also: currently
// createglobalStyle from styled-components is throwing a warning about how
// there's not typing exported from styled-comps
const GlobalStyles = createGlobalStyle `
  ${cssReset};

  @font-face {
    font-family: "Formular";
    src: url("/fonts/Formular-Light.woff2") format("woff2"), url("/fonts/Formular-Light.woff") format("woff");
    font-weight: 300;
    font-display: swap;
  }

  @font-face {
    font-family: "Formular";
    src: url("/fonts/Formular-Regular.woff2") format("woff2"), url("/fonts/Formular-Regular.woff") format("woff");
    font-weight: 400;
    font-display: swap;
  }

  html {
    font-size: 18px;
    background-color: ${colors.backgroundBlack};
  }

  body {
    font-family: 'Formular', sans-serif !important;
    -webkit-font-smoothing: antialiased;
    color: #fff;
  }

  .visuallyHidden {
    position: absolute !important;
    clip: rect(1px 1px 1px 1px); /* IE6, IE7 */
    clip: rect(1px, 1px, 1px, 1px);
    padding:0 !important;
    border:0 !important;
    height: 1px !important;
    width: 1px !important;
    overflow: hidden;
  }
`;

export {GlobalStyles};
