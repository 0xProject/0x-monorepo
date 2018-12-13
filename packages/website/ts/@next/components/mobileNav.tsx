import * as React from 'react';
import styled from 'styled-components';

export class MobileNav extends React.PureComponent {
    public render(): React.Node {
        const { isToggled, toggleMobileNav } = this.props;

        return (
            <Wrap isToggled={isToggled}>
                <Section>
                    <ul>
                        <li>0x instant</li>
                        <li>0x Launch Kit</li>
                    </ul>
                </Section>

                <Section isDark={true}>
                    a
                </Section>

                {isToggled &&
                    <Overlay onClick={toggleMobileNav} />
                }
            </Wrap>
        );
    }
}

const Wrap = styled.nav`
    width: 100%;
    height: 357px;
    background-color: ${props => props.theme.mobileNavBgUpper};
    color: ${props => props.theme.mobileNavColor};
    transition: transform 0.5s;
    transform: translate3d(0, ${props => props.isToggled ? 0 : '-100%'}, 0);
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    z-index: 999;
    top: 0;
    left: 0;
`;

const Overlay = styled.div`
    position: absolute;
    width: 100vw;
    height: 100vh;
    top: 100%;
    background: transparent;
    cursor: pointer;
`;

const Section = styled.div`
    width: 100%;
    padding: 30px;
    background-color: ${props => props.isDark && props.theme.mobileNavBgLower};
`;
