import { getMuiTheme } from 'material-ui/styles';
import { colors } from 'ts/utils/colors';

export const muiTheme = getMuiTheme({
    appBar: {
        height: 45,
        color: colors.white,
        textColor: colors.black,
    },
    palette: {
        accent1Color: colors.lightBlueA700,
        pickerHeaderColor: colors.mediumBlue,
        primary1Color: colors.mediumBlue,
        primary2Color: colors.mediumBlue,
        textColor: colors.grey700,
    },
    datePicker: {
        color: colors.grey700,
        textColor: colors.white,
        calendarTextColor: colors.grey,
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
});
