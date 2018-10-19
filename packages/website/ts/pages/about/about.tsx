import { colors, Link, Styles } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import { Footer } from 'ts/components/footer';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Profile } from 'ts/pages/about/profile';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ProfileInfo, WebsitePaths } from 'ts/types';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const teamRow1: ProfileInfo[] = [
    {
        name: 'Will Warren',
        title: 'Co-founder & CEO',
        description: `Smart contract R&D. Previously applied physics at Los Alamos \
                      Nat Lab. Mechanical engineering at UC San Diego. PhD dropout.`,
        image: '/images/team/will.jpg',
        linkedIn: 'https://www.linkedin.com/in/will-warren-92aab62b/',
        github: 'https://github.com/willwarren89',
        medium: 'https://medium.com/@willwarren89',
    },
    {
        name: 'Amir Bandeali',
        title: 'Co-founder & CTO',
        description: `Smart contract R&D. Previously fixed income trader at DRW. \
                      Finance at University of Illinois, Urbana-Champaign.`,
        image: '/images/team/amir.png',
        linkedIn: 'https://www.linkedin.com/in/abandeali1/',
        github: 'https://github.com/abandeali1',
        medium: 'https://medium.com/@abandeali1',
    },
    {
        name: 'Fabio Berger',
        title: 'Senior Engineer',
        description: `Full-stack blockchain engineer. Previously software engineer \
                      at Airtable and founder of WealthLift. Computer Science at Duke.`,
        image: '/images/team/fabio.jpg',
        linkedIn: 'https://www.linkedin.com/in/fabio-berger-03ab261a/',
        github: 'https://github.com/fabioberger',
        medium: 'https://medium.com/@fabioberger',
    },
];

const teamRow2: ProfileInfo[] = [
    {
        name: 'Alex Xu',
        title: 'Director of Operations',
        description: `Strategy and operations. Previously digital marketing at Google \
                      and vendor management at Amazon. Economics at UC San Diego.`,
        image: '/images/team/alex.jpg',
        linkedIn: 'https://www.linkedin.com/in/alex-xu/',
        github: '',
        medium: 'https://medium.com/@aqxu',
    },
    {
        name: 'Leonid Logvinov',
        title: 'Engineer',
        description: `Full-stack blockchain engineer. Previously blockchain engineer \
                      at Neufund. Computer Science at University of Warsaw.`,
        image: '/images/team/leonid.png',
        linkedIn: 'https://www.linkedin.com/in/leonidlogvinov/',
        github: 'https://github.com/LogvinovLeon',
        medium: 'https://medium.com/@Logvinov',
    },
    {
        name: 'Ben Burns',
        title: 'Designer',
        description: `Product, motion, and graphic designer. Previously designer \
                      at Airtable and Apple. Digital Design at University of Cincinnati.`,
        image: '/images/team/ben.jpg',
        linkedIn: 'https://www.linkedin.com/in/ben-burns-30170478/',
        github: '',
        medium: '',
    },
];

const teamRow3: ProfileInfo[] = [
    {
        name: 'Brandon Millman',
        title: 'Senior Engineer',
        description: `Full-stack engineer. Previously senior software engineer at \
                      Twitter. Computer Science and Electrical Engineering at Duke.`,
        image: '/images/team/brandon.png',
        linkedIn: 'https://www.linkedin.com/in/brandon-millman-b093a022/',
        github: 'https://github.com/BMillman19',
        medium: 'https://medium.com/@bchillman',
    },
    {
        name: 'Tom Schmidt',
        title: 'Product Manager',
        description: `Previously engineering at Apple, product management at Facebook and Instagram. Computer Science at Stanford.`,
        image: '/images/team/tom.jpg',
        linkedIn: 'https://www.linkedin.com/in/tomhschmidt/',
        github: 'https://github.com/tomhschmidt',
        medium: '',
    },
    {
        name: 'Jacob Evans',
        title: 'Ecosystem Engineer',
        description: `Previously software engineer at Qantas and RSA Security.`,
        image: '/images/team/jacob.jpg',
        linkedIn: 'https://www.linkedin.com/in/dekzter/',
        github: 'https://github.com/dekz',
        medium: '',
    },
];

const teamRow4: ProfileInfo[] = [
    {
        name: 'Blake Henderson',
        title: 'Operations Associate',
        description: `Operations and Analytics. Previously analytics at LinkedIn. Economics at UC San Diego.`,
        image: '/images/team/blake.jpg',
        linkedIn: 'https://www.linkedin.com/in/blakerhenderson/',
        github: '',
        medium: '',
    },
    {
        name: 'Zack Skelly',
        title: 'Lead Recruiter',
        description: `Talent. Previously first recruiter at Heap, recruiting at Dropbox and Google. English Rhetoric and Composition at Pepperdine.`,
        image: '/images/team/zach.png',
        linkedIn: 'https://www.linkedin.com/in/zackaryskelly/',
        github: '',
        medium: '',
    },
    {
        name: 'Greg Hysen',
        title: 'Blockchain Engineer',
        description: `Smart contract R&D. Previously lead distributed systems engineer at Hivemapper. Computer Science at University of Waterloo.`,
        image: '/images/team/greg.jpeg',
        linkedIn: 'https://www.linkedin.com/in/gregory-hysen-71741463/',
        github: 'https://github.com/hysz',
        medium: '',
    },
];

const teamRow5: ProfileInfo[] = [
    {
        name: 'Remco Bloemen',
        title: 'Technical Fellow',
        description: `Previously cofounder at Neufund and Coblue. Part III at Cambridge. PhD dropout at Twente Business School.`,
        image: '/images/team/remco.jpeg',
        linkedIn: 'https://www.linkedin.com/in/remcobloemen/',
        github: 'http://github.com/recmo',
        medium: '',
    },
    {
        name: 'Francesco Agosti',
        title: 'Engineer',
        description: `Full-stack engineer. Previously senior software engineer at Yelp. Computer Science at Duke.`,
        image: 'images/team/fragosti.png',
        linkedIn: 'https://www.linkedin.com/in/fragosti/',
        github: 'http://github.com/fragosti',
    },
    {
        name: 'Mel Oberto',
        title: 'Office Ops / Executive Assistant',
        description: `Daily Operations. Previously People Operations Associate at Heap. Marketing and MBA at Sacred Heart University.`,
        image: 'images/team/mel.png',
        linkedIn: 'https://www.linkedin.com/in/melanieoberto',
    },
];

const teamRow6: ProfileInfo[] = [
    {
        name: 'Alex Browne',
        title: 'Engineer in Residence',
        description: `Full-stack blockchain engineer. Previously at Plaid. Open source guru and footgun dismantler. Computer Science and Electrical Engineering at Duke.`,
        image: 'images/team/alexbrowne.png',
        linkedIn: 'https://www.linkedin.com/in/stephenalexbrowne/',
        github: 'http://github.com/albrow',
    },
    {
        name: 'Peter Zeitz',
        title: 'Research Fellow',
        description: `Researching decentralized governance. Previously Assistant Professor of Economics at National University of Singapore Business School. PhD in Economics at UCLA.`,
        image: 'images/team/peter.jpg',
        linkedIn: 'https://www.linkedin.com/in/peter-z-7b9595163/',
    },
    {
        name: 'Chris Kalani',
        title: 'Director of Design',
        description: `Previously founded Wake (acquired by InVision). Early Facebook product designer.`,
        image: 'images/team/chris.png',
        linkedIn: 'https://www.linkedin.com/in/chriskalani/',
        github: 'https://github.com/chriskalani',
    },
];

const teamRow7: ProfileInfo[] = [
    {
        name: 'Clay Robbins',
        title: 'Ecosystem Development Lead',
        description: `Growth & Business Development. Previously product and partnerships at Square. Economics at Dartmouth College.`,
        image: 'images/team/clay.png',
        linkedIn: 'https://www.linkedin.com/in/robbinsclay/',
    },
    {
        name: 'Matt Taylor',
        title: 'Marketing Lead',
        description: `Growth & Marketing. Previously marketing at Abra and Square. Economics and Philosophy at Claremont McKenna College.`,
        image: 'images/team/matt.jpg',
        linkedIn: 'https://www.linkedin.com/in/mattytay/',
    },
    {
        name: 'Eugene Aumson',
        title: 'Engineer',
        description: `Developer Experience. Previously senior software engineer in foreign exchange applications at Bloomberg LP.`,
        image: 'images/team/gene.jpg',
        linkedIn: 'https://www.linkedin.com/in/aumson/',
        github: 'https://github.com/feuGeneA',
    },
];

const teamRow8: ProfileInfo[] = [
    {
        name: 'Weijie Wu',
        title: 'Research Fellow',
        description: `Researching decentralized governance. Previously Researcher at Huawei and Assistant Professor at Shanghai Jiao Tong University. PhD in Computer Science at The Chinese University of Hong Kong.`,
        image: 'images/team/weijie.png',
        linkedIn: 'https://www.linkedin.com/in/weijiewu/',
    },
    {
        name: 'Rahul Singireddy',
        title: 'Relayer Success Manager',
        description: `Previously community at Zeppelin, growth at Dharma, and cryptocurrency contributor at Forbes. Symbolic Systems at Stanford.`,
        image: 'images/team/rahul.png',
        linkedIn: 'https://www.linkedin.com/in/rahul-singireddy-3037908a/',
    },
    {
        name: 'Jason Somensatto',
        title: 'Strategic Legal Counsel',
        description: `Legal. Previously head of blockchain and crypto practice at Orrick. JD from George Washington University and undergrad at UVA.`,
        image: 'images/team/jason.png',
        linkedIn: 'https://www.linkedin.com/in/jasonsomensatto/',
    },
];

const teamRow9: ProfileInfo[] = [
    {
        name: 'Steve Klebanoff',
        title: 'Senior Engineer',
        description: ` Full-stack engineer. Previously Staff Software Engineer at AppFolio. Computer Science & Cognitive Psychology at Northeastern University.`,
        image: 'images/team/steve.png',
        linkedIn: 'https://www.linkedin.com/in/steveklebanoff/',
        github: 'https://github.com/steveklebanoff',
    },
];

const advisors1: ProfileInfo[] = [
    {
        name: 'Fred Ehrsam',
        description: 'Co-founder of Coinbase. Previously FX trader at Goldman Sachs.',
        image: '/images/advisors/fred.jpg',
        linkedIn: 'https://www.linkedin.com/in/fredehrsam/',
        medium: 'https://medium.com/@FEhrsam',
        twitter: 'https://twitter.com/FEhrsam',
    },
    {
        name: 'Olaf Carlson-Wee',
        image: '/images/advisors/olaf.png',
        description: 'Founder of Polychain Capital. First hire at Coinbase. Angel investor.',
        linkedIn: 'https://www.linkedin.com/in/olafcw/',
        angellist: 'https://angel.co/olafcw',
    },
    {
        name: 'Joey Krug',
        description: `Co-CIO at Pantera Capital. Founder of Augur. Thiel 20 Under 20 Fellow.`,
        image: '/images/advisors/joey.jpg',
        linkedIn: 'https://www.linkedin.com/in/joeykrug/',
        github: 'https://github.com/joeykrug',
        angellist: 'https://angel.co/joeykrug',
    },
];

const advisors2: ProfileInfo[] = [
    {
        name: 'Linda Xie',
        description: 'Co-founder of Scalar Capital. Previously PM at Coinbase.',
        image: '/images/advisors/linda.jpg',
        linkedIn: 'https://www.linkedin.com/in/lindaxie/',
        medium: 'https://medium.com/@linda.xie',
        twitter: 'https://twitter.com/ljxie',
    },
    {
        name: 'David Sacks',
        description: 'General Partner at Craft Ventures. Original COO of PayPal. Founder of Yammer.',
        image: '/images/advisors/david.png',
        linkedIn: 'https://www.linkedin.com/in/davidoliversacks/',
        medium: 'https://medium.com/@davidsacks',
        twitter: 'https://twitter.com/DavidSacks',
    },
];

export interface AboutProps {
    source: string;
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

interface AboutState {}

const styles: Styles = {
    header: {
        fontFamily: 'Roboto Mono',
        fontSize: 36,
        color: 'black',
        paddingTop: 110,
    },
    weAreHiring: {
        fontSize: 30,
        color: colors.darkestGrey,
        fontFamily: 'Roboto Mono',
        letterSpacing: 7.5,
    },
};

export class About extends React.Component<AboutProps, AboutState> {
    public componentDidMount(): void {
        window.scrollTo(0, 0);
    }
    public render(): React.ReactNode {
        return (
            <div style={{ backgroundColor: colors.lightestGrey }}>
                <DocumentTitle title="0x About Us" />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    style={{ backgroundColor: colors.lightestGrey }}
                    translate={this.props.translate}
                />
                <div id="about" className="mx-auto max-width-4 py4" style={{ color: colors.grey800 }}>
                    <div className="mx-auto pb4 sm-px3" style={{ maxWidth: 435 }}>
                        <div style={styles.header}>About us:</div>
                        <div
                            className="pt3"
                            style={{
                                fontSize: 17,
                                color: colors.darkestGrey,
                                lineHeight: 1.5,
                            }}
                        >
                            Our team is a globally distributed group with backgrounds in engineering, research, business
                            and design. We are passionate about decentralized technology and its potential to act as an
                            equalizing force in the world.
                        </div>
                    </div>
                    <div className="pt3 md-px4 lg-px0">
                        <div className="clearfix pb3">{this._renderProfiles(teamRow1)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow2)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow3)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow4)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow5)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow6)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow7)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow8)}</div>
                        <div className="clearfix">{this._renderProfiles(teamRow9)}</div>
                    </div>
                    <div className="pt3 pb2">
                        <div
                            className="pt2 pb3 sm-center md-pl4 lg-pl0 md-ml3"
                            style={{
                                color: colors.grey,
                                fontSize: 24,
                                fontFamily: 'Roboto Mono',
                            }}
                        >
                            Advisors:
                        </div>
                        <div className="clearfix">{this._renderProfiles(advisors1)}</div>
                        <div className="clearfix">{this._renderProfiles(advisors2)}</div>
                    </div>
                    <div className="mx-auto py4 sm-px3" style={{ maxWidth: 308 }}>
                        <div className="pb2" style={styles.weAreHiring}>
                            WE'RE HIRING
                        </div>
                        <div
                            className="pb4 mb4"
                            style={{
                                fontSize: 16,
                                color: colors.darkestGrey,
                                lineHeight: 1.5,
                                letterSpacing: '0.5px',
                            }}
                        >
                            We are seeking outstanding candidates to{' '}
                            <Link to={WebsitePaths.Careers} textDecoration="underline" fontColor="black">
                                join our team
                            </Link>
                            . We value passion, diversity and unique perspectives.
                        </div>
                    </div>
                </div>
                <Footer translate={this.props.translate} dispatcher={this.props.dispatcher} />
            </div>
        );
    }
    private _renderProfiles(profiles: ProfileInfo[]): React.ReactNode {
        const numIndiv = profiles.length;
        const colSize = utils.getColSize(numIndiv);
        return _.map(profiles, profile => {
            return (
                <div key={`profile-${profile.name}`}>
                    <Profile colSize={colSize} profileInfo={profile} />
                </div>
            );
        });
    }
}
