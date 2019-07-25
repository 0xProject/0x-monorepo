import * as _ from 'lodash';
import * as React from 'react';
import { DocumentTitle } from 'ts/components/document_title';
import { Footer } from 'ts/components/old_footer';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Question } from 'ts/pages/faq/question';
import { Dispatcher } from 'ts/redux/dispatcher';
import { FAQQuestion, FAQSection, Styles, WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { documentConstants } from 'ts/utils/document_meta_constants';
import { Translate } from 'ts/utils/translate';

export interface FAQProps {
    source: string;
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

interface FAQState {}

const styles: Styles = {
    thin: {
        fontWeight: 100,
    },
};

const sections: FAQSection[] = [
    {
        name: '0x Protocol',
        questions: [
            {
                prompt: 'What is 0x?',
                answer: (
                    <div>
                        At its core, 0x is an open and non-rent seeking protocol that facilitates trustless, low
                        friction exchange of Ethereum-based assets. Developers can use 0x as a platform to build
                        exchange applications on top of (
                        <a href={`${configs.BASE_URL}${WebsitePaths.ZeroExJs}#introduction`} target="blank">
                            0x.js
                        </a>{' '}
                        is a Javascript library for interacting with the 0x protocol). For end users, 0x will be the
                        infrastructure of a wide variety of user-facing applications i.e.{' '}
                        <a href={`${configs.BASE_URL}${WebsitePaths.Portal}`} target="blank">
                            0x Portal
                        </a>
                        , a decentralized application that facilitates trustless trading of Ethereum-based tokens
                        between known counterparties.
                    </div>
                ),
            },
            {
                prompt: 'What problem does 0x solve?',
                answer: (
                    <div>
                        In the two years since the Ethereum blockchain’s genesis block, numerous decentralized
                        applications (dApps) have created Ethereum smart contracts for peer-to-peer exchange. Rapid
                        iteration and a lack of best practices have left the blockchain scattered with proprietary and
                        application-specific implementations. As a result, end users are exposed to numerous smart
                        contracts of varying quality and security, with unique configuration processes and learning
                        curves, all of which implement the same functionality. This approach imposes unnecessary costs
                        on the network by fragmenting end users according to the particular dApp each user happens to be
                        using, eliminating valuable network effects around liquidity. 0x is the solution to this problem
                        by acting as modular, unopinionated building blocks that may be assembled and reconfigured.
                    </div>
                ),
            },
            {
                prompt: 'How is 0x different from a centralized exchange like Poloniex or ShapeShift?',
                answer: (
                    <div>
                        <ul>
                            <li>0x is a protocol for exchange, not a user-facing exchange application.</li>
                            <li>
                                0x is decentralized and trustless; there is no central party which can be hacked, run
                                away with customer funds or be subjected to government regulations. Hacks of Mt. Gox,
                                Shapeshift and Bitfinex have demonstrated that these types of systemic risks are
                                palpable.
                            </li>
                            <li>
                                Rather than a proprietary system that exists to extract rent for its owners, 0x is
                                public infrastructure that is funded by a globally distributed community of
                                stakeholders. While the protocol is free to use, it enables for-profit user-facing
                                exchange applications to be built on top of the protocol.
                            </li>
                        </ul>
                    </div>
                ),
            },
            {
                prompt: 'If 0x protocol is free to use, where do transaction fees come in?',
                answer: (
                    <div>
                        0x protocol uses off-chain order books to massively reduce friction costs for market makers and
                        ensure that the blockchain is only used for trade settlement. Hosting and maintaining an
                        off-chain order book is a service; to incent “Relayers” to provide this service they must be
                        able to charge transaction fees on trading activity. Relayers are free to set their transaction
                        fees to any value they desire. We expect Relayers to be highly competitive and transaction fees
                        to approach an efficient economic equilibrium over time.
                    </div>
                ),
            },
            {
                prompt: 'What are the differences between 0x protocol and state channels?',
                answer: (
                    <div>
                        <div>
                            Participants in a state channel pass cryptographically signed messages back and forth,
                            accumulating intermediate state changes without publishing them to the canonical chain until
                            the channel is closed. State channels are ideal for “bar tab” applications where numerous
                            intermediate state changes may be accumulated off-chain before being settled by a final
                            on-chain transaction (i.e. day trading, poker, turn-based games).
                        </div>
                        <ul>
                            <li>
                                While state channels drastically reduce the number of on-chain transactions for specific
                                use cases, numerous on-chain transactions and a security deposit are required to open
                                and safely close a state channel making them less efficient than 0x for executing
                                one-time trades.
                            </li>
                            <li>
                                State channels are isolated from the Ethereum blockchain meaning that they cannot
                                interact with smart contracts. 0x is designed to be integrated directly into smart
                                contracts so trades can be executed programmatically in a single line of Solidity code.
                            </li>
                        </ul>
                    </div>
                ),
            },
            {
                prompt: 'What types of digital assets are supported by 0x?',
                answer: (
                    <div>
                        0x supports all Ethereum-based assets that adhere to the ERC20 token standard. There are many
                        ERC20 tokens, worth a combined $2.2B, and more tokens are created each month. We believe that,
                        by 2020, thousands of assets will be tokenized and moved onto the Ethereum blockchain including
                        traditional securities such as equities, bonds and derivatives, fiat currencies and scarce
                        digital goods such as video game items. In the future, cross-blockchain solutions such as{' '}
                        <a href="https://cosmos.network/" target="_blank">
                            Cosmos
                        </a>{' '}
                        and{' '}
                        <a href="http://polkadot.io/" target="_blank">
                            Polkadot
                        </a>{' '}
                        will allow cryptocurrencies to freely move between blockchains and, naturally, currencies such
                        as Bitcoin will end up being represented as ERC20 tokens on the Ethereum blockchain.
                    </div>
                ),
            },
            {
                prompt: '0x is open source: what prevents someone from forking the protocol?',
                answer: (
                    <div>
                        Ethereum and Bitcoin are both open source protocols. Each protocol has been forked, but the
                        resulting clone networks have seen little adoption (as measured by transaction count or market
                        cap). This is because users have little to no incentive to switch over to a clone network if the
                        original has initial network effects and a talented developer team behind it. An exception is in
                        the case that a protocol includes a controversial feature such as a method of rent extraction or
                        a monetary policy that favors one group of users over another (Zcash developer subsidy - for
                        better or worse - resulted in Zclassic). Perceived inequality can provide a strong enough
                        incentive that users will fork the original protocol’s codebase and spin up a new network that
                        eliminates the controversial feature. In the case of 0x, there is no rent extraction and no
                        users are given special permissions. 0x protocol is upgradable. Cutting-edge technical
                        capabilities can be integrated into 0x via decentralized governance (see section below),
                        eliminating incentives to fork off of the original protocol and sacrifice the network effects
                        surrounding liquidity that result from the shared protocol and settlement layer.
                    </div>
                ),
            },
        ],
    },
    {
        name: '0x Token (ZRX)',
        questions: [
            {
                prompt: 'Explain how the 0x protocol token (zrx) works.',
                answer: (
                    <div>
                        <div>
                            0x protocol token (ZRX) is utilized in two ways: 1) to solve the{' '}
                            <a href="https://en.wikipedia.org/wiki/Coordination_game" target="_blank">
                                coordination problem
                            </a>{' '}
                            and drive network effects around liquidity, creating a feedback loop where early adopters of
                            the protocol benefit from wider adoption and 2) to be used for decentralized governance over
                            0x protocol's update mechanism. In more detail:
                        </div>
                        <ul>
                            <li>
                                ZRX tokens are used by Makers and Takers (market participants that generate and consume
                                orders, respectively) to pay transaction fees to Relayers (entities that host and
                                maintain public order books).
                            </li>
                            <li>
                                ZRX tokens are used for decentralized governance over 0x protocol’s update mechanism
                                which allows its underlying smart contracts to be replaced and improved over time. An
                                update mechanism is needed because 0x is built upon Ethereum’s rapidly evolving
                                technology stack, decentralized governance is needed because 0x protocol’s smart
                                contracts will have access to user funds and numerous dApps will need to plug into 0x
                                smart contracts. Decentralized governance ensures that this update process is secure and
                                minimizes disruption to the network.
                            </li>
                        </ul>
                    </div>
                ),
            },
            {
                prompt: 'Why must transaction fees be denominated in 0x token (ZRX) rather than ETH?',
                answer: (
                    <div>
                        0x protocol’s decentralized update mechanism is analogous to proof-of-stake. To maximize the
                        alignment of stakeholder and end user incentives, the staked asset must provide utility within
                        the protocol.
                    </div>
                ),
            },
            {
                prompt: 'How will decentralized governance work?',
                answer: (
                    <div>
                        Decentralized governance is an ongoing focus of research; it will involve token voting with ZRX.
                        Ultimately the solution will maximize security while also maximizing the protocol’s ability to
                        absorb new innovations. Until the governance structure is formalized and encoded within 0x DAO,
                        a multi-sig will be used as a placeholder.
                    </div>
                ),
            },
        ],
    },
    {
        name: 'ZRX Token Launch and Fund Use',
        questions: [
            {
                prompt: 'What is the total supply of ZRX tokens?',
                answer: <div>1,000,000,000 ZRX. Fixed supply.</div>,
            },
            {
                prompt: 'When was the token launch? Was there a pre-sale?',
                answer: <div>The token launch was on August 15th, 2017. There was no pre-sale.</div>,
            },
            {
                prompt: 'What will the token launch proceeds be used for?',
                answer: (
                    <div>
                        100% of the proceeds raised in the token launch will be used to fund the development of free and
                        open source software, tools and infrastructure that support the protocol and surrounding
                        ecosystem. Check out our{' '}
                        <a
                            href="https://docs.google.com/document/d/1_RVa-_bkU92fWRsC8eNy4vYjcTt-WC8GtqyyjbTd-oY"
                            target="_blank"
                        >
                            development roadmap
                        </a>
                        .
                    </div>
                ),
            },
            {
                prompt: 'What will be the initial distribution of ZRX tokens?',
                answer: (
                    <div>
                        <div className="center" style={{ width: '100%' }}>
                            <img style={{ width: 350 }} src="/images/zrx_pie_chart.png" />
                        </div>
                        <div className="py1">
                            <div className="bold pb1">Token Launch (50%)</div>
                            <div>
                                ZRX is inherently a governance token that plays a critical role in the process of
                                upgrading 0x protocol. We are fully committed to formulating a functional and
                                theoretically sound governance model and we plan to dedicate significant resources to
                                R&D.
                            </div>
                        </div>
                        <div className="py1">
                            <div className="bold pb1">Retained by 0x (15%)</div>
                            <div>
                                The 0x core development team will be able to sustain itself for approximately five years
                                using funds raised through the token launch. If 0x protocol proves to be as foundational
                                a technology as we believe it to be, the retained ZRX tokens will allow the 0x core
                                development team to sustain operations beyond the first 5 years.
                            </div>
                        </div>
                        <div className="py1">
                            <div className="bold pb1">Developer Fund (15%)</div>
                            <div>
                                The Developer Fund will be used to make targeted capital injections into high potential
                                projects and teams that are attempting to grow the 0x ecosystem, strategic partnerships,
                                hackathon prizes and community development activities.
                            </div>
                        </div>
                        <div className="py1">
                            <div className="bold pb1">Founding Team (10%)</div>
                            <div>
                                The founding team’s allocation of ZRX will vest over a traditional 4 year vesting
                                schedule with a one year cliff. We believe this should be standard practice for any team
                                that is committed to making their project a long term success.
                            </div>
                        </div>
                        <div className="py1">
                            <div className="bold pb1">Early Backers & Advisors (10%)</div>
                            <div>
                                Our backers and advisors have provided capital, resources and guidance that have allowed
                                us to fill out our team, setup a robust legal entity and build a fully functional
                                product before launching a token. As a result, we have a proven track record and can
                                offer a token that holds genuine utility.
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                prompt: 'Can I mine ZRX tokens?',
                answer: (
                    <div>
                        No, the total supply of ZRX tokens is fixed and there is no continuous issuance model. Users
                        that facilitate trading over 0x protocol by operating a Relayer earn transaction fees
                        denominated in ZRX; as more trading activity is generated, more transaction fees are earned.
                    </div>
                ),
            },
            {
                prompt: 'Will there be a lockup period for ZRX tokens sold in the token launch?',
                answer: <div>No, ZRX tokens sold in the token launch will immediately be liquid.</div>,
            },
            {
                prompt: 'Will there be a lockup period for tokens allocated to the founding team?',
                answer: (
                    <div>
                        Yes. ZRX tokens allocated to founders, advisors and staff members will be released over a 4 year
                        vesting schedule with a 25% cliff upon completion of the initial token launch and 25% released
                        each subsequent year in monthly installments. Staff members hired after the token launch will
                        have a 4 year vesting schedule with a one year cliff.
                    </div>
                ),
            },
            {
                prompt: 'Which cryptocurrencies will be accepted in the token launch?',
                answer: <div>ETH.</div>,
            },
            {
                prompt: 'When will 0x be live?',
                answer: (
                    <div>
                        An alpha version of 0x has been live on our private test network since January 2017. Version 1.0
                        of 0x protocol will be deployed to the canonical Ethereum blockchain after a round of security
                        audits and prior to the public token launch. 0x will be using the 0x protocol during our token
                        launch.
                    </div>
                ),
            },
            {
                prompt: 'Where can I find a development roadmap?',
                answer: (
                    <div>
                        Check it out{' '}
                        <a
                            href="https://drive.google.com/open?id=14IP1N8mt3YdsAoqYTyruMnZswpklUs3THyS1VXx71fo"
                            target="_blank"
                        >
                            here
                        </a>
                        .
                    </div>
                ),
            },
        ],
    },
    {
        name: 'Team',
        questions: [
            {
                prompt: 'Where is 0x based?',
                answer: <div>0x was founded in SF and is driven by a diverse group of contributors.</div>,
            },
            {
                prompt: 'How can I get involved?',
                answer: (
                    <div>
                        Join our{' '}
                        <a href={constants.URL_ZEROEX_CHAT} target="_blank">
                            Discord
                        </a>
                        ! As an open source project, 0x will rely on a worldwide community of passionate developers to
                        contribute proposals, ideas and code.
                    </div>
                ),
            },
            {
                prompt: 'Why the name 0x?',
                answer: (
                    <div>
                        0x is the prefix for hexadecimal numeric constants including Ethereum addresses. In a more
                        abstract context, as the first open protocol for exchange 0x represents the beginning of the end
                        for the exchange industry’s rent seeking oligopoly: zero exchange.
                    </div>
                ),
            },
            {
                prompt: 'How do you pronounce 0x?',
                answer: <div>We pronounce 0x as “zero-ex,” but you are free to pronounce it however you please.</div>,
            },
        ],
    },
];

export class FAQ extends React.Component<FAQProps, FAQState> {
    public componentDidMount(): void {
        window.scrollTo(0, 0);
    }
    public render(): React.ReactNode {
        return (
            <div>
                <DocumentTitle {...documentConstants.FAQ} />
                <TopBar blockchainIsLoaded={false} location={this.props.location} translate={this.props.translate} />
                <div id="faq" className="mx-auto max-width-4 pt4" style={{ color: colors.grey800 }}>
                    <h1 className="center" style={{ ...styles.thin }}>
                        0x FAQ
                    </h1>
                    <div className="sm-px2 md-px2 lg-px0 pb4">{this._renderSections()}</div>
                </div>
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </div>
        );
    }
    private _renderSections(): React.ReactNode {
        const renderedSections = _.map(sections, (section: FAQSection, i: number) => {
            const isFirstSection = i === 0;
            return (
                <div key={section.name}>
                    <h3>{section.name}</h3>
                    {this._renderQuestions(section.questions, isFirstSection)}
                </div>
            );
        });
        return renderedSections;
    }
    private _renderQuestions(questions: FAQQuestion[], isFirstSection: boolean): React.ReactNode {
        const renderedQuestions = _.map(questions, (question: FAQQuestion, i: number) => {
            const isFirstQuestion = i === 0;
            return (
                <Question
                    key={question.prompt}
                    prompt={question.prompt}
                    answer={question.answer}
                    shouldDisplayExpanded={isFirstSection && isFirstQuestion}
                />
            );
        });
        return renderedQuestions;
    }
}
