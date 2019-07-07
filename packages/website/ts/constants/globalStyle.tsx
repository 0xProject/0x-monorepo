import { createGlobalStyle, withTheme } from 'styled-components';
import { cssReset } from 'ts/constants/cssReset';

export interface GlobalStyle {
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
        dropdownButtonBg: string;
    };
}

const GlobalStyles = withTheme(
    createGlobalStyle<GlobalStyle>`
    ${cssReset};

    html {
        font-size: 18px;
        background-color: ${props => props.theme.bgColor};
        overflow-x: hidden;
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
            --heroIcon: 282px;
        }
    }

    @media (max-width: 1170px) {
      :root {
        --largeHeading: 60px;
      }
    }

    @media (max-width: 768px) {
        :root {
            --smallHeading: 18px;
            --defaultHeading: 18px;
            --mediumHeading: 40px;
            --largeHeading: 46px;
            --smallHeadingHeight: 1.4em; // TO DO
            --defaultHeadingHeight: 1.357142857em; // TO DO
            --mediumHeadingHeight: 1.16em; // TO DO
            --largeHeadingHeight: 1.108695652em; // TO DO
            --smallParagraph: 14px; // TO DO
            --defaultParagraph: 16px; // TO DO
            --mediumParagraph: 20px; // TO DO
            --largeParagraph: 20px; // TO DO
            --smallIcon: 55px;
            --mediumIcon: 85px;
            --largeIcon: 115px;
        }
    }

    body {
        font-family: 'Formular', sans-serif !important;
        -webkit-font-smoothing: antialiased;
        color: ${props => props.theme.textColor};
        font-feature-settings: "zero";
        scroll-behavior: smooth;
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

    input {
        font-family: 'Formular Mono', sans-serif;
    }

    img, svg {
        max-width: 100%;
        object-fit: contain;
    }

    a, button {
        text-decoration: none;
        font-family: inherit;
        outline: none;
    }

    svg + p,
    img + p {
        padding-top: 30px;
    }

    strong {
        font-weight: 500;
    }
`,
);

export { GlobalStyles };
