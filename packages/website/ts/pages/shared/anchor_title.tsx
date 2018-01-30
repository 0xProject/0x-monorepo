import * as React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { HeaderSizes, Styles } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const headerSizeToScrollOffset: { [headerSize: string]: number } = {
	h2: -20,
	h3: 0,
};

interface AnchorTitleProps {
	title: string | React.ReactNode;
	id: string;
	headerSize: HeaderSizes;
	shouldShowAnchor: boolean;
}

interface AnchorTitleState {
	isHovering: boolean;
}

const styles: Styles = {
	anchor: {
		fontSize: 20,
		transform: 'rotate(45deg)',
		cursor: 'pointer',
	},
	headers: {
		WebkitMarginStart: 0,
		WebkitMarginEnd: 0,
		fontWeight: 'bold',
		display: 'block',
	},
	h1: {
		fontSize: '1.8em',
		WebkitMarginBefore: '0.83em',
		WebkitMarginAfter: '0.83em',
	},
	h2: {
		fontSize: '1.5em',
		WebkitMarginBefore: '0.83em',
		WebkitMarginAfter: '0.83em',
	},
	h3: {
		fontSize: '1.17em',
		WebkitMarginBefore: '1em',
		WebkitMarginAfter: '1em',
	},
};

export class AnchorTitle extends React.Component<AnchorTitleProps, AnchorTitleState> {
	constructor(props: AnchorTitleProps) {
		super(props);
		this.state = {
			isHovering: false,
		};
	}
	public render() {
		let opacity = 0;
		if (this.props.shouldShowAnchor) {
			opacity = this.state.isHovering ? 0.6 : 1;
		}
		return (
			<div className="relative flex" style={{ ...styles[this.props.headerSize], ...styles.headers }}>
				<div className="inline-block" style={{ paddingRight: 4 }}>
					{this.props.title}
				</div>
				<ScrollLink
					to={this.props.id}
					offset={headerSizeToScrollOffset[this.props.headerSize]}
					duration={constants.DOCS_SCROLL_DURATION_MS}
					containerId={constants.DOCS_CONTAINER_ID}
				>
					<i
						className="zmdi zmdi-link"
						onClick={utils.setUrlHash.bind(utils, this.props.id)}
						style={{ ...styles.anchor, opacity }}
						onMouseOver={this._setHoverState.bind(this, true)}
						onMouseOut={this._setHoverState.bind(this, false)}
					/>
				</ScrollLink>
			</div>
		);
	}
	private _setHoverState(isHovering: boolean) {
		this.setState({
			isHovering,
		});
	}
}
