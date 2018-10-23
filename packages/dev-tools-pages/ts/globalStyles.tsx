import { createGlobalStyle } from 'styled-components';
import { media } from './variables';
import styledNormalize from 'styled-normalize';
import hljsStyles from 'highlight.js/styles/github-gist.css';

import { withContext } from 'ts/components/withContext';

const BaseStyles = createGlobalStyle`
    ${styledNormalize}
    ${hljsStyles}

    @font-face {
        font-family: "Maison Neue";
        src: url("/fonts/MaisonNeue-Book-subset.woff2") format("woff2"), url("/fonts/MaisonNeue-Book-subset.woff") format("woff");
        font-weight: 300;
        font-display: swap;
        unicode-range: U+20-7E;
    }
    @font-face {
        font-family: "Maison Neue";
        src: url("/fonts/MaisonNeue-Bold-subset.woff2") format("woff2"), url("/fonts/MaisonNeue-Bold-subset.woff") format("woff");
        font-weight: 500;
        font-display: swap;
        unicode-range: U+20-7E;
    }
    @font-face {
        font-family: "Maison Neue Mono";
        src: url("/fonts/MaisonNeue-Mono-subset.woff2") format("woff2"), url("/fonts/MaisonNeue-Mono-subset.woff") format("woff");
        font-weight: 300;
        font-display: optional;
        unicode-range: U+20-7E;
    }

    html {
        font-size: 100%;
        box-sizing: border-box;
    }
    
    *, *::before, *::after {
        box-sizing: inherit;
    }
    
    body {
        font-family: "Maison Neue", system-ui, sans-serif;
        font-weight: 300;
        font-size: 1rem;
        line-height: 1.8;

        ${media.small`font-size: 0.875rem;`};
    }

    a {
        color: ${(props: any) => props.colors.type};
        text-decoration: none; 

        &:hover {
            color: red; //what should this be?
        }
    }
    
    h1, h2, h3, h4 {
        font-weight: 500;
        margin: 0;
    }

    p {
        margin-top: 0;
        margin-bottom: 1em;
        &:not([class]):last-of-type {
            margin-bottom: 0;
        }
    }

    code {
        font-family: "Maison Neue Mono", monospace;
        ${media.small`
            font-size: .75rem;
        `}
    }
`;

export default withContext(BaseStyles);
