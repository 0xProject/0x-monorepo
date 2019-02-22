import * as React from 'react';

import { DocumentTitle } from 'ts/components/document_title';
import { SectionLandingAbout } from 'ts/components/sections/landing/about';
import { SectionLandingClients } from 'ts/components/sections/landing/clients';
import { SectionLandingCta } from 'ts/components/sections/landing/cta';
import { SectionLandingHero } from 'ts/components/sections/landing/hero';
import { SiteWrap } from 'ts/components/siteWrap';

import { ModalContact } from 'ts/components/modals/modal_contact';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface Props {
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

export class NextLanding extends React.Component<Props> {
    public state = {
        isContactModalOpen: false,
    };
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
                <DocumentTitle {...documentConstants.LANDING} />
                <SectionLandingHero />
                <SectionLandingAbout />
                <SectionLandingClients />
                <SectionLandingCta onContactClick={this._onOpenContactModal} />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal} />
            </SiteWrap>
        );
    }

    public _onOpenContactModal = (): void => {
        this.setState({ isContactModalOpen: true });
    };

    public _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    };
}
