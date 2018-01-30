import * as _ from 'lodash';
import * as React from 'react';
import { CustomType } from 'ts/types';
import { utils } from 'ts/utils/utils';

const STRING_ENUM_CODE_PREFIX = ' strEnum(';

interface CustomEnumProps {
	type: CustomType;
}

// This component renders custom string enums that was a work-around for versions of
// TypeScript <2.4.0 that did not support them natively. We keep it around to support
// older versions of 0x.js <0.9.0
export function CustomEnum(props: CustomEnumProps) {
	const type = props.type;
	if (!_.startsWith(type.defaultValue, STRING_ENUM_CODE_PREFIX)) {
		utils.consoleLog('We do not yet support `Variable` types that are not strEnums');
		return null;
	}
	// Remove the prefix and postfix, leaving only the strEnum values without quotes.
	const enumValues = type.defaultValue.slice(10, -3).replace(/'/g, '');
	return (
		<span>
			{`{`}
			{'\t'}
			{enumValues}
			<br />
			{`}`}
		</span>
	);
}
