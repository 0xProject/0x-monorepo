import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components';

import { Header as DocsHeader } from 'ts/components/docs/header/header';
import { Footer } from 'ts/components/footer';
import { Header as MainHeader } from 'ts/components/header';

import { GlobalStyles } from 'ts/constants/globalStyle';
import { GLOBAL_THEMES } from 'ts/style/theme';

interface ISiteWrapProps {
    theme?: 'dark' | 'light' | 'gray';
    isDocs?: boolean;
    isFullScreen?: boolean;
    children: any;
}

interface IMainProps {
    isNavToggled: boolean;
    isFullScreen?: boolean;
}

export const SiteWrap: React.FC<ISiteWrapProps> = props => {
    const { children, theme = 'dark', isDocs, isFullScreen } = props;
    const [isMobileNavOpen, setIsMobileNavOpen] = React.useState<boolean>(false);

    const Header = isDocs ? DocsHeader : MainHeader;

    React.useEffect(() => {
        document.documentElement.style.overflowY = 'auto';
        window.scrollTo(0, 0);
    }, []);

    const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

    return (
        <ThemeProvider theme={GLOBAL_THEMES[theme]}>
            <>
                <GlobalStyles />

                <Header isNavToggled={isMobileNavOpen} toggleMobileNav={toggleMobileNav} />

                <Main isNavToggled={isMobileNavOpen} isFullScreen={isFullScreen}>
                    {children}
                </Main>

                <Footer isDocs={isDocs} />
            </>
        </ThemeProvider>
    );
};

const Main = styled.main<IMainProps>`
    transition: transform 0.5s, opacity 0.5s;
    opacity: ${props => props.isNavToggled && '0.5'};
    padding-bottom: 70px;

    ${props =>
        props.isFullScreen &&
        `
        display: flex;
        align-items: center;
        min-height: calc(100vh - 108px - 381px);
    `}
`;
