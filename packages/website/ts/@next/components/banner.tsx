import * as React from 'react';
import styled from 'styled-components';

import {colors} from 'ts/style/colors';

import {Button, Link} from 'ts/@next/components/button';
import {Wrap, WrapCentered } from 'ts/@next/components/layout';
import {Paragraph, Heading} from 'ts/@next/components/text';
import { ThemeInterface } from 'ts/@next/components/siteWrap';

import {Column, Section} from 'ts/@next/components/newLayout';

interface Props {
    heading?: string;
    subline?: string;
    mainCta?: CTAButton;
    secondaryCta?: CTAButton;
    theme?: ThemeInterface;
}

interface CTAButton {
    text: string;
    href: string;
}

interface BorderProps {
    isBottom?: boolean;
}

export const Banner: React.StatelessComponent<Props> = (props: Props) => {
    const {
        heading,
        subline,
        mainCta,
        secondaryCta,
    } = props;
    return (
        <CustomSection
            bgColor="light"
            isFlex={true}
            flexBreakpoint="900px"
            paddingMobile="120px 0"
        >
            <Border/>
            <Border isBottom={true} />

            <Column colWidth="1/2" isPadLarge={true}>
                <CustomHeading isNoMargin={true}>{heading}</CustomHeading>

                {subline &&
                    <Paragraph isMuted={0.5} isNoMargin={true}>
                        {subline}
                    </Paragraph>
                }
            </Column>
            <Column colWidth="1/2" isPadLarge={true}>
                <ButtonWrap>
                    {mainCta &&
                        <Link href={mainCta.href}>{mainCta.text}</Link>
                    }

                    {secondaryCta &&
                        <Button href={secondaryCta.href} isTransparent={true}>{secondaryCta.text}</Button>
                    }
                </ButtonWrap>
            </Column>
        </CustomSection>
    );
};

const CustomSection = styled(Section)`
    @media (max-width: 900px) {
        text-align: center;

        p {
            margin-bottom: 30px;
        }

        div:last-child {
            margin-bottom: 0;
        }
    }
`;

const CustomHeading = styled.h2`
    font-size: 34px;
    font-weight: 400;
    margin-bottom: 10px

    @media (max-width: 768px) {
        font-size: 30px;
    }
`;

const ButtonWrap = styled.div`
    display: inline-block;

    @media (min-width: 768px) {
        * + * {
            margin-left: 15px;
        }
    }

    @media (max-width: 768px) {
        a, button {
            display: block;
            width: 220px;
        }

        * + * {
            margin-top: 15px;
        }
    }
`;

// Note let's refactor this
// is it absolutely necessary to have a stateless component
// to pass props down into the styled icon?
const Border = styled.div<BorderProps>`
    position: absolute;
    background-image: ${props => props.isBottom ? 'url(/images/@next/banner/bottomofcta.png);': 'url(/images/@next/banner/topofcta.png);' };
    background-position: ${props => props.isBottom ? 'left top' : 'left bottom' };
    left: 0;
    width: calc(100% + 214px);
    height: 40px;
    top: ${props => !props.isBottom && 0 };
    bottom: ${props => props.isBottom && 0 };
    transform: translate(-112px);
`;
