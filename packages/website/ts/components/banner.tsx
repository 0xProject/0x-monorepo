import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button } from 'ts/components/button';
import { ThemeInterface } from 'ts/components/siteWrap';
import { Paragraph } from 'ts/components/text';

import { Column, Section } from 'ts/components/newLayout';

interface Props {
    heading?: string;
    subline?: string;
    customCta?: React.ReactNode;
    mainCta?: CTAButton;
    secondaryCta?: CTAButton;
    theme?: ThemeInterface;
}

interface CTAButton {
    text: string;
    href?: string;
    onClick?: () => void;
    shouldOpenInNewTab?: boolean;
}

interface BorderProps {
    isBottom?: boolean;
}

export const Banner: React.StatelessComponent<Props> = (props: Props) => {
    const { heading, subline, mainCta, secondaryCta, customCta } = props;
    return (
        <CustomSection
            bgColor={colors.brandDark}
            isFlex={true}
            flexBreakpoint="900px"
            paddingMobile="120px 0"
            alignItems="center"
        >
            <Border />
            <Border isBottom={true} />

            <Column maxWidth="455px">
                <CustomHeading>{heading}</CustomHeading>

                {subline && (
                    <Paragraph color={colors.white} isMuted={0.5} isNoMargin={true}>
                        {subline}
                    </Paragraph>
                )}
            </Column>
            <ColumnCta>
                <ButtonWrap>
                    {customCta}

                    {mainCta && (
                        <Button
                            color={colors.white}
                            isTransparent={false}
                            href={mainCta.href}
                            onClick={mainCta.onClick}
                            target={mainCta.shouldOpenInNewTab ? '_blank' : ''}
                        >
                            {mainCta.text}
                        </Button>
                    )}

                    {secondaryCta && (
                        <Button
                            color={colors.white}
                            href={secondaryCta.href}
                            onClick={secondaryCta.onClick}
                            isTransparent={true}
                        >
                            {secondaryCta.text}
                        </Button>
                    )}
                </ButtonWrap>
            </ColumnCta>
        </CustomSection>
    );
};

const CustomSection = styled(Section)`
    color: ${colors.white};
    margin-top: 30px;
    margin-top: 0;

    @media (max-width: 900px) {
        align-items: center;
        display: flex;
        flex-direction: column;
        text-align: center;

        p {
            margin-bottom: 30px;
        }

        div:last-child {
            margin-bottom: 0;
        }
    }
`;

const ColumnCta = styled(Column)`
    flex-shrink: 0;
`;

const CustomHeading = styled.h2`
    font-size: 34px;
    line-height: normal;
    font-weight: 400;
    margin-bottom: 10px;

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
        a,
        button {
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
    background-image: ${props =>
        props.isBottom ? 'url(/images/banner/bottomofcta.png);' : 'url(/images/banner/topofcta.png);'};
    background-position: ${props => (props.isBottom ? 'left top' : 'left bottom')};
    left: 0;
    width: calc(100% + 214px);
    height: 40px;
    top: ${props => !props.isBottom && 0};
    bottom: ${props => props.isBottom && 0};
    transform: translate(-112px);

    @media (max-width: 768px) {
        width: calc(100% + 82px);
        height: 40px;
        transform: translate(-41px);
        background-size: auto 80px;
    }
`;
