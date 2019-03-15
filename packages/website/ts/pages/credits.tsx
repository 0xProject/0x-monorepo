import * as _ from 'lodash';
import * as React from 'react';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { CenteredDefinition } from 'ts/components/centeredDefinition';
import { DocumentTitle } from 'ts/components/document_title';
import { Hero } from 'ts/components/hero';
import { ModalContact, ModalContactType } from 'ts/components/modals/modal_contact';
import { FlexWrap, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading } from 'ts/components/text';
import { documentConstants } from 'ts/utils/document_meta_constants';

export interface CreditsProps {
    location: Location;
}

export class Credits extends React.Component<CreditsProps> {
    public state = {
        isContactModalOpen: false,
    };
    constructor(props: CreditsProps) {
        super(props);
    }
    public componentDidMount(): void {
        if ('URLSearchParams' in window) {
            const urlParams = new URLSearchParams(this.props.location.search);
            const modal = urlParams.get('modal');
            if (modal) {
                this.setState({ isContactModalOpen: true });
            }
        }
    }
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.INFRASTRUCTURE_CREDITS} />
                <Hero
                    maxWidth="865px"
                    maxWidthHeading="765px"
                    isLargeTitle={false}
                    isFullWidth={false}
                    isCenteredMobile={false}
                    title="Earn free infrastructure credits when building on top of 0x"
                    description="0x has teamed up with a variety of service providers to offer free credits for any team working on 0x in a full time capacity."
                    actions={this._renderHeroActions()}
                />

                <Section bgColor="light" maxWidth="1200px">
                    <Heading
                        asElement="h2"
                        fontWeight={'400'}
                        size={34}
                        isCentered={true}
                        isMuted={1}
                        padding={[0, 0, 'default', 0]}
                        maxWidth={'685px'}
                    >
                        Get your project off the ground with these great services
                    </Heading>

                    <FlexWrap>
                        <CenteredDefinition
                            title="Amazon Web Services"
                            titleSize="small"
                            description="$10,000 in cloud credits and $5,000 in support"
                            icon="aws"
                            iconSize="medium"
                            isInline={true}
                        />

                        <CenteredDefinition
                            title="Alchemy"
                            titleSize="small"
                            description="6 months of Ethereum node service, subsidized by 0x"
                            icon="alchemy"
                            iconSize="medium"
                            isInline={true}
                        />
                        <CenteredDefinition
                            title="Digital Ocean"
                            titleSize="small"
                            description="$25,000 in cloud credits to get your relayer off the ground"
                            icon="digital_ocean"
                            iconSize="medium"
                            isInline={true}
                        />
                    </FlexWrap>
                </Section>

                <Banner
                    heading="Start building today."
                    subline="Have questions? Join our Discord"
                    mainCta={{ text: 'Apply Now', onClick: this._onOpenContactModal }}
                    secondaryCta={{ text: 'Join Discord', href: 'https://discordapp.com/invite/d3FTX3M' }}
                />
                <ModalContact
                    isOpen={this.state.isContactModalOpen}
                    onDismiss={this._onDismissContactModal}
                    modalContactType={ModalContactType.Credits}
                />
            </SiteWrap>
        );
    }

    private readonly _onOpenContactModal = (): void => {
        this.setState({ isContactModalOpen: true });
    };

    private readonly _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    };

    private readonly _renderHeroActions = () => (
        <Button onClick={this._onOpenContactModal} bgColor="dark" isInline={true}>
            Apply Now
        </Button>
    );
}
