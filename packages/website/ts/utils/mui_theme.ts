import { getMuiTheme } from 'material-ui/styles';
import { colors } from 'ts/utils/colors';

export const muiTheme = getMuiTheme({
    appBar: {
        height: 45,
        color: colors.white,
        textColor: colors.black,
    },
    palette: {
        pickerHeaderColor: colors.lightBlue,
        primary1Color: colors.lightBlue,
        primary2Color: colors.lightBlue,
        textColor: colors.grey700,
    },
    datePicker: {
        color: colors.grey700,
        textColor: colors.white,
        calendarTextColor: colors.white,
        selectColor: colors.darkestGrey,
        selectTextColor: colors.white,
    },
    timePicker: {
        color: colors.grey700,
        textColor: colors.white,
        accentColor: colors.white,
        headerColor: colors.darkestGrey,
        selectColor: colors.darkestGrey,
        selectTextColor: colors.darkestGrey,
    },
    toggle: {
        thumbOnColor: colors.limeGreen,
        trackOnColor: colors.lightGreen,
    },
});
