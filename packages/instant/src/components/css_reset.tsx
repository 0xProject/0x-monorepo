import { INJECTED_DIV_CLASS } from '../constants';
import { createGlobalStyle } from '../style/theme';

export interface CSSResetProps {}

/*
* Derived from
* https://github.com/jtrost/Complete-CSS-Reset
*/
export const CSSReset = createGlobalStyle`
    .${INJECTED_DIV_CLASS} {
        a, abbr, area, article, aside, audio, b, bdo, blockquote, body, button,
        canvas, caption, cite, code, col, colgroup, command, datalist, dd, del,
        details, dialog, dfn, div, dl, dt, em, embed, fieldset, figure, form,
        h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img,
        input, ins, keygen, kbd, label, legend, li, map, mark, menu, meter, nav,
        noscript, object, ol, optgroup, option, output, p, param, pre, progress,
        q, rp, rt, ruby, samp, section, select, small, span, strong, sub, sup,
        table, tbody, td, textarea, tfoot, th, thead, time, tr, ul, var, video {
            background: transparent;
            border: 0;
            font-size: 100%;
            font: inherit;
            margin: 0;
            outline: none;
            padding: 0;
            text-align: left;
            text-decoration: none;
            vertical-align: baseline;
        }
    }
`;
