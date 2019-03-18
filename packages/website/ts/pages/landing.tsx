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
    location: Location;
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
    public componentDidMount(): void {
        if (this.props.location.hash.includes('contact')) {
            this._onOpenContactModal();
        }
    }
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
    private readonly _onOpenContactModal = (): void => {
        window.history.replaceState(null, null, `${window.location.pathname}${window.location.search}#contact`);
        this.setState({ isContactModalOpen: true });
    };

    private readonly _onDismissContactModal = (): void => {
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
        this.setState({ isContactModalOpen: false });
    };
}
