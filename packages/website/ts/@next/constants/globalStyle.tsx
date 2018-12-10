import {createGlobalStyle, withTheme} from 'styled-components';
import {cssReset} from 'ts/@next/constants/cssReset';

interface GlobalStyle {
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
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

    @media (min-width: 768px) {
        :root {
            --smallHeading: 20px;
            --defaultHeading: 28px;
            --mediumHeading: 50px;
            --largeHeading: 80px;
            --smallHeadingHeight: 1.4em;
            --defaultHeadingHeight: 1.357142857em;
            --mediumHeadingHeight: 1.16em;
            --largeHeadingHeight: 1em;
            --smallParagraph: 14px;
            --defaultParagraph: 18px;
            --mediumParagraph: 22px;
            --largeParagraph: 28px;
            --smallIcon: 75px;
            --mediumIcon: 85px;
            --largeIcon: 145px;
        }
    }

    @media (max-width: 768px) {
        :root {
            --smallHeading: 16px;
            --defaultHeading: 18px;
            --mediumHeading: 32px;
            --largeHeading: 46px;
            --smallHeadingHeight: 1.4em; // TO DO
            --defaultHeadingHeight: 1.357142857em; // TO DO
            --mediumHeadingHeight: 1.16em; // TO DO
            --largeHeadingHeight: 1.108695652em; // TO DO
            --smallParagraph: 14px; // TO DO
            --defaultParagraph: 16px; // TO DO
            --mediumParagraph: 16px; // TO DO
            --largeParagraph: 18px; // TO DO
            --smallIcon: 45px;
            --mediumIcon: 55px;
            --largeIcon: 115px;
        }
    }

    body {
        font-family: 'Formular', sans-serif !important;
        -webkit-font-smoothing: antialiased;
        color: ${props => props.theme.textColor};
        font-feature-settings: "zero";
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

    img, svg {
        max-width: 100%;
        object-fit: contain;
    }

    p, li {
        font-size: 1rem;
        line-height: 1.444444444em; // 26px
    }

    :root a {
        text-decoration: none;
    }

    svg + p,
    img + p {
        padding-top: 30px;
    }
`);

export { GlobalStyles };
