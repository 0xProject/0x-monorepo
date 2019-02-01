import { colors, Styles } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { ProfileInfo } from 'ts/types';

const IMAGE_DIMENSION = 149;
const styles: Styles = {
    subheader: {
        textTransform: 'uppercase',
        fontSize: 32,
        margin: 0,
    },
    imageContainer: {
        width: IMAGE_DIMENSION,
        height: IMAGE_DIMENSION,
        boxShadow: 'rgba(0, 0, 0, 0.19) 2px 5px 10px',
    },
};

interface ProfileProps {
    colSize: number;
    profileInfo: ProfileInfo;
}

export const Profile = (props: ProfileProps) => {
    return (
        <div className={`lg-col md-col lg-col-${props.colSize} md-col-6`}>
            <div style={{ maxWidth: 300 }} className="mx-auto lg-px3 md-px3 sm-px4 sm-pb3">
                <div className="circle overflow-hidden mx-auto" style={styles.imageContainer}>
                    <img width={IMAGE_DIMENSION} src={props.profileInfo.image} />
                </div>
                <div className="center" style={{ fontSize: 18, fontWeight: 'bold', paddingTop: 20 }}>
                    {props.profileInfo.name}
                </div>
                {!_.isUndefined(props.profileInfo.title) && (
                    <div
                        className="pt1 center"
                        style={{
                            fontSize: 14,
                            fontFamily: 'Roboto Mono',
                            color: colors.darkGrey,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {props.profileInfo.title.toUpperCase()}
                    </div>
                )}
                <div style={{ minHeight: 60, lineHeight: 1.4 }} className="pt1 pb2 mx-auto lg-h6 md-h6 sm-h5 sm-center">
                    {props.profileInfo.description}
                </div>
                <div className="flex pb3 sm-hide xs-hide" style={{ width: 280, opacity: 0.5 }}>
                    {renderSocialMediaIcons(props.profileInfo)}
                </div>
            </div>
        </div>
    );
};

function renderSocialMediaIcons(profileInfo: ProfileInfo): React.ReactNode {
    const icons = [
        renderSocialMediaIcon('zmdi-github-box', profileInfo.github),
        renderSocialMediaIcon('zmdi-linkedin-box', profileInfo.linkedIn),
        renderSocialMediaIcon('zmdi-twitter-box', profileInfo.twitter),
    ];
    return icons;
}

function renderSocialMediaIcon(iconName: string, url: string): React.ReactNode {
    if (_.isEmpty(url)) {
        return null;
    }

    return (
        <div key={url} className="pr1">
            <a href={url} style={{ color: 'inherit' }} target="_blank" className="text-decoration-none">
                <i className={`zmdi ${iconName}`} style={{ ...styles.socalIcon }} />
            </a>
        </div>
    );
}
