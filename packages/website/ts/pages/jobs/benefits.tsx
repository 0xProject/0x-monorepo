import * as _ from 'lodash';
import * as React from 'react';

import { Circle } from 'ts/components/ui/circle';
import { Container } from 'ts/components/ui/container';
import { FilledImage } from 'ts/components/ui/filled_image';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const BENEFITS = [
    'Comprehensive insurance. Medical, dental, and vision coverage for you and your family.',
    'Unlimited vacation. Three weeks per year minimum.',
    'Flexible hours and libteral work-from-home-policy.',
    'Relocation Assistance.',
    'Whole team offsites and community / hackathon events (often international).',
    'Monthly transportation and phone reimbursement.',
    'Meals and snacks prvided in-office daily',
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
        <Container className="flex flex-column items-center py4 sm-px3" backgroundColor={colors.white}>
            {!isSmallScreen ? (
                <Container className="flex" maxWidth="800px">
                    <BenefitsList />
                    <Container marginLeft="215px">
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
    <Container marginBottom="51px">
        <Text fontFamily="Roboto Mono" fontSize="24px" fontColor={colors.black}>
            {children}
        </Text>
    </Container>
);

const BenefitsList = () => {
    return (
        <Container maxWidth="360px">
            <Header>Benefits</Header>
            {_.map(BENEFITS, benefit => <BenefitItem key={benefit} description={benefit} />)}
        </Container>
    );
};
interface BenefitItemProps {
    description: string;
}

const BenefitItem: React.StatelessComponent<BenefitItemProps> = ({ description }) => (
    <Container marginBottom="30px">
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

const openMissionAndValuesBlogPost = () => {
    utils.openUrl(constants.URL_MISSION_AND_VALUES_BLOG_POST);
};
const ValuesList = () => {
    return (
        <Container maxWidth="360px">
            <Header>Our Values</Header>
            {_.map(VALUES, value => <ValueItem key={value.text} {...value} />)}
            <Text fontSize="14px" lineHeight="26px">
                We care deeply about our mission and encourage you to{' '}
                <a
                    style={{ color: colors.mediumBlue }}
                    target="_blank"
                    href={constants.URL_MISSION_AND_VALUES_BLOG_POST}
                >
                    read more here
                </a>.
            </Text>
        </Container>
    );
};

type ValueItemProps = Value;
const ValueItem: React.StatelessComponent<ValueItemProps> = ({ iconSrc, text }) => {
    return (
        <Container marginBottom="45px">
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
