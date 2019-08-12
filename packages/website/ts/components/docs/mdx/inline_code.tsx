// import * as React from 'react';
// import SyntaxHighlighter from 'react-syntax-highlighter';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

export const InlineCode = styled.code`
    background-color: ${colors.backgroundLight};
    color: ${colors.brandDark};
    border: none;
    font-weight: 500;
    padding: 0px 6px;
`;

// interface IInlineCodeProps {
//     children: any;
// }

// export const InlineCode: React.FC<IInlineCodeProps> = props => {
//     console.log('props', props);
//     return (
//         <SyntaxHighlighter
//             language={'typescript'}
//             style={style}
//             CodeTag={CodeTag}
//             showLineNumbers={false}
//             wrapLines={true}
//         >
//             {props.children}
//         </SyntaxHighlighter>
//     );
// };

// const CodeTag = styled.code`
//     /* background-color: ${colors.backgroundLight};
//     color: ${colors.brandDark};
//     border: none;
//     font-weight: 500;
//     padding: 0px 6px; */
// `;

// const style = {
//     'hljs-comment': {
//         color: '#7e7887',
//     },
//     'hljs-quote': {
//         color: '#7e7887',
//     },
//     'hljs-variable': {
//         color: '#be4678',
//     },
//     'hljs-template-variable': {
//         color: '#be4678',
//     },
//     'hljs-attribute': {
//         color: '#be4678',
//     },
//     'hljs-regexp': {
//         color: '#be4678',
//     },
//     'hljs-link': {
//         color: '#be4678',
//     },
//     'hljs-tag': {
//         color: '#61f5ff',
//     },
//     'hljs-name': {
//         color: '#61f5ff',
//     },
//     'hljs-selector-id': {
//         color: '#be4678',
//     },
//     'hljs-selector-class': {
//         color: '#be4678',
//     },
//     'hljs-number': {
//         color: '#c994ff',
//     },
//     'hljs-meta': {
//         color: '#61f5ff',
//     },
//     'hljs-built_in': {
//         color: '#aa573c',
//     },
//     'hljs-builtin-name': {
//         color: '#aa573c',
//     },
//     'hljs-literal': {
//         color: '#aa573c',
//     },
//     'hljs-type': {
//         color: '#aa573c',
//     },
//     'hljs-params': {
//         color: '#aa573c',
//     },
//     'hljs-string': {
//         color: '#781818',
//     },
//     'hljs-function': {
//         color: '#781818',
//     },
//     'hljs-symbol': {
//         color: '#2a9292',
//     },
//     'hljs-bullet': {
//         color: '#2a9292',
//     },
//     'hljs-title': {
//         color: '#576ddb',
//     },
//     'hljs-section': {
//         color: '#576ddb',
//     },
//     'hljs-keyword': {
//         color: '#253C90',
//     },
//     'hljs-selector-tag': {
//         color: '#253C90',
//     },
//     'hljs-deletion': {
//         color: '#19171c',
//         display: 'inline-block',
//         width: '100%',
//         backgroundColor: '#be4678',
//     },
//     'hljs-addition': {
//         color: '#19171c',
//         display: 'inline-block',
//         width: '100%',
//         backgroundColor: '#2a9292',
//     },
//     hljs: {
//         display: 'block',
//         overflowX: 'hidden',
//         background: colors.backgroundLight,
//         fontSize: '12px',
//         paddingLeft: '20px',
//         paddingTop: '20px',
//         paddingBottom: '20px',
//     },
//     'hljs-emphasis': {
//         fontStyle: 'italic',
//     },
//     'hljs-strong': {
//         fontWeight: 'bold',
//     },
// };
