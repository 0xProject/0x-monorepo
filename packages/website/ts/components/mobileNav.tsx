import * as React from 'react';
import MediaQuery from 'react-responsive';
import styled from 'styled-components';

import { Link } from 'react-router-dom';

import { WrapGrid, WrapProps } from 'ts/components/newLayout';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

interface Props {
    isToggled: boolean;
    toggleMobileNav: () => void;
}

export class MobileNav extends React.PureComponent<Props> {
    public render(): React.ReactNode {
        const { isToggled, toggleMobileNav } = this.props;

        return (
            <MediaQuery maxWidth={800}>
                <Wrap isToggled={isToggled}>
                    <Section>
                        <h4>Products</h4>

                        <ul>
                            <li>
                                <Link to={WebsitePaths.Instant}>0x Instant</Link>
                            </li>
                            <li>
                                <Link to={WebsitePaths.LaunchKit}>0x Launch Kit</Link>
                            </li>
                            <li>
                                <Link to={WebsitePaths.ContractFillableLiquidity}>Contract Liquidity</Link>
                            </li>
                        </ul>
                    </Section>

                    <Section isDark={true}>
                        <Grid as="ul" isFullWidth={true} isWrapped={true}>
                            <li>
                                <Link to={WebsitePaths.Why}>Why 0x</Link>
                            </li>
                            <li>
                                <Link to={WebsitePaths.AboutMission}>About</Link>
                            </li>
                            <li>
                                <a href={constants.URL_BLOG} target="_blank">
                                    Blog
                                </a>
                            </li>
                        </Grid>
                    </Section>

                    {isToggled && <Overlay onClick={toggleMobileNav} />}
                </Wrap>
            </MediaQuery>
        );
    }
}

const Wrap = styled.nav<{ isToggled: boolean }>`
    width: 100%;
    height: 400px;
    background-color: ${props => props.theme.mobileNavBgUpper};
    color: ${props => props.theme.mobileNavColor};
    transition: ${props => (props.isToggled ? 'visibility 0s, transform 0.5s' : 'visibility 0s 0.5s, transform 0.5s')};
    transform: translate3d(0, ${props => (props.isToggled ? 0 : '-100%')}, 0);
    visibility: ${props => !props.isToggled && 'hidden'};
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    z-index: 20;
    top: 0;
    left: 0;
    font-size: 20px;

    a {
        padding: 15px 0;
        display: block;
        color: inherit;
    }

    h4 {
        font-size: 14px;
        opacity: 0.5;
    }
`;

const Overlay = styled.div`
    position: absolute;
    width: 100vw;
    height: 100vh;
    top: 100%;
    background: transparent;
    cursor: pointer;
`;

interface SectionProps {
    isDark?: boolean;
}
const Section = styled.div<SectionProps>`
    width: 100%;
    padding: 15px 30px;
    background-color: ${props => (props.isDark ? props.theme.mobileNavBgLower : 'transparent')};
`;

const Grid = styled(WrapGrid)<WrapProps>`
    justify-content: flex-start;

    li {
        width: 50%;
        flex-shrink: 0;
    }
`;
