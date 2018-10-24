import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/variables';
import BaseButton from './Button';

var highlight = require('highlighter')();

interface CodeProps {
    children: React.ReactNode;
    language?: string;
    light?: boolean;
}

interface CodeState {
    hlCode?: string;
    copied?: boolean;
}

const Button = styled(BaseButton)`
    opacity: 0;
    position: absolute;
    top: 1rem;
    right: 1rem;
    transition: opacity 0.2s;
    :focus {
        opacity: 1;
    }
`;

const Base =
    styled.div <
        CodeProps >
        `
    color: ${props => (props.language === undefined ? colors.white : 'inherit')};
    background-color: ${props =>
            props.light ? 'rgba(255,255,255,.15)' : props.language === undefined ? colors.black : colors.lightGray};
    white-space: ${props => (props.language === undefined ? 'nowrap' : '')};
    position: relative;
    &:hover ${Button} {
        opacity: 1;
    }
`;

const StyledCode = styled.code`
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    display: block;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;

    
    .diff-addition {
        background-color: #d2e9e0;
        padding: 0.3125rem;
        display: inline-block;
        width: 100%;
    }
    .diff-deletion {
        background-color: #ebdcdc;
        padding: 0.3125rem;
        display: inline-block;
        width: 100%;
    }
`;

const StyledPre = styled.pre`
    margin: 0;
`;

const StyledCopyInput = styled.textarea`
    height: 0;
    position: absolute;
    top: 0;
    right: 0;
    z-index: -1;
`;

const CopyInput = StyledCopyInput as any;

class Code extends React.Component<CodeProps, CodeState> {
    code = React.createRef<HTMLTextAreaElement>();

    state: CodeState = {};

    constructor(props: CodeProps) {
        super(props);
    }

    async componentDidMount() {
        const { language, children } = this.props;

        if (language !== undefined) {
            const { default: hljs } = await System.import(/* webpackChunkName: 'highlightjs' */ 'ts/highlight');

            const hlCode = hljs(children as string, language);
            this.setState({ hlCode });
        }
    }

    handleCopy = async () => {
        try {
            if ('clipboard' in navigator) {
                await (navigator as any).clipboard.writeText(this.props.children);
                this.setState({ copied: true });
            } else {
                this.code.current.focus();
                this.code.current.select();
                document.execCommand('copy');
                this.setState({ copied: true });
            }
        } catch (error) {
            this.setState({ copied: false });
        }
    };

    render() {
        const { language, light, children } = this.props;

        return (
            <Base language={language} light={light}>
                <StyledPre>
                    {this.state.hlCode !== undefined ? (
                        <StyledCode dangerouslySetInnerHTML={{ __html: this.state.hlCode }} />
                    ) : (
                            <StyledCode>{this.props.children}</StyledCode>
                        )}
                </StyledPre>
                {navigator.userAgent !== 'ReactSnap' ? <Button onClick={this.handleCopy}>Copy</Button> : null}
                {!('clipboard' in navigator) ? (
                    <CopyInput readOnly aria-hidden="true" ref={this.code} value={children} />
                ) : null}
            </Base>
        );
    }
}

export default Code;
