import * as _ from 'lodash';
import * as React from 'react';

import { Circle } from 'ts/components/ui/circle';
import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import { ScreenWidths } from 'ts/types';
import { constants } from 'ts/utils/constants';

const BENEFITS = [
    'Comprehensive insurance (medical, dental, and vision)',
    'Unlimited vacation (three weeks per year minimum)',
    'Meals and snacks provided in-office daily',
    'Flexible hours and liberal work-from-home-policy',
    'Supportive remote working environment',
    'Transportation, phone, and wellness expense',
    'Relocation assistance',
    'Optional team excursions (fully paid, often international)',
    'Competitive salary and cryptocurrency-based compensation',
];

interface Value {
    iconSrc: string;
    text: string;
}
const VALUES: Value[] = [
    {
        iconSrc: 'images/jobs/heart-icon.svg',
        text: 'Do the right thing',
    },
    {
        iconSrc: 'images/jobs/ship-icon.svg',
        text: 'Consistently ship',
    },
    {
        iconSrc: 'images/jobs/calendar-icon.svg',
        text: 'Focus on long term impact',
    },
];

export interface BenefitsProps {
    screenWidth: ScreenWidths;
}

export const Benefits = (props: BenefitsProps) => {
    const isSmallScreen = props.screenWidth === ScreenWidths.Sm;
    return (
        <Container className="flex flex-column items-center py4 px3" backgroundColor={colors.white}>
            {!isSmallScreen ? (
                <Container className="flex" maxWidth="1200px">
                    <BenefitsList />
                    <Container marginLeft="120px">
                        <ValuesList />
                    </Container>
                </Container>
            ) : (
                <Container className="flex-column">
                    <BenefitsList />
                    <Container marginTop="50px">
                        <ValuesList />
                    </Container>
                </Container>
            )}
        </Container>
    );
};

const Header: React.StatelessComponent = ({ children }) => (
    <Container marginBottom="30px">
        <Text fontFamily="Roboto Mono" fontSize="24px" fontColor={colors.black}>
            {children}
        </Text>
    </Container>
);

interface BenefitsListProps {
    className?: string;
}
const PlainBenefitsList: React.StatelessComponent<BenefitsListProps> = ({ className }) => {
    return (
        <Container className={className}>
            <Header>Benefits</Header>
            {_.map(BENEFITS, benefit => <BenefitItem key={benefit} description={benefit} />)}
        </Container>
    );
};
const BenefitsList = styled(PlainBenefitsList)`
    transform: translateY(30px);
`;

interface BenefitItemProps {
    description: string;
}

const BenefitItem: React.StatelessComponent<BenefitItemProps> = ({ description }) => (
    <Container marginBottom="15px">
        <div className="flex">
            <Circle className="flex-none pr2 pt1" diameter={8} fillColor={colors.black} />
            <div className="flex-auto">
                <Text fontSize="14px" lineHeight="24px">
                    {description}
                </Text>
            </div>
        </div>
    </Container>
);

interface ValuesListProps {
    className?: string;
}
const PlainValuesList: React.StatelessComponent<ValuesListProps> = ({ className }) => {
    return (
        <Container className={className} maxWidth="270px">
            <Header>Our Values</Header>
            {_.map(VALUES, value => <ValueItem key={value.text} {...value} />)}
            <Text fontSize="14px" lineHeight="26px">
                We care deeply about our culture and values, and encourage you to{' '}
                <a
                    style={{ color: colors.mediumBlue, textDecoration: 'none' }}
                    target="_blank"
                    href={constants.URL_MISSION_AND_VALUES_BLOG_POST}
                >
                    read more on our blog
                </a>.
            </Text>
        </Container>
    );
};

const ValuesList = styled(PlainValuesList)`
    border-color: ${colors.beigeWhite};
    border-radius: 7px;
    border-width: 1px;
    border-style: solid;
    padding-left: 38px;
    padding-right: 38px;
    padding-top: 28px;
    padding-bottom: 28px;
`;

type ValueItemProps = Value;
const ValueItem: React.StatelessComponent<ValueItemProps> = ({ iconSrc, text }) => {
    return (
        <Container marginBottom="25px">
            <div className="flex items-center">
                <Image className="flex-none pr2" width="20px" src={iconSrc} />
                <div className="flex-auto">
                    <Text fontSize="14px" lineHeight="24px" fontWeight="bold">
                        {text}
                    </Text>
                </div>
            </div>
        </Container>
    );
};
