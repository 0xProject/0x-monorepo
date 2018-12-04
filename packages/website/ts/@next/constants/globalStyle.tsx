import { createGlobalStyle, withTheme } from 'styled-components';
import {cssReset} from 'ts/@next/constants/cssReset';

interface GlobalStyle {
    theme: {
        bgColor: string;
        textColor: string;
    };
}

const GlobalStyles = withTheme(createGlobalStyle<GlobalStyle> `
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
        background-color: ${props => props.theme.bgColor};
    }

    body {
        font-family: 'Formular', sans-serif !important;
        -webkit-font-smoothing: antialiased;
        color: ${props => props.theme.textColor};
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

    img {
        max-width: 100%;
        object-fit: contain;
    }

    p, li {
        font-size: 1rem;
        line-height: 1.444444444em; // 26px
    }

    :root a {
        color: inherit;
        text-decoration: none;
    }
`);

export { GlobalStyles };
