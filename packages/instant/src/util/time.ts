const secondsToMinutesAndRemainingSeconds = (seconds: number): { minutes: number; remainingSeconds: number } => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;

    return {
        minutes,
        remainingSeconds,
    };
};

const padZero = (aNumber: number): string => {
    return aNumber < 10 ? `0${aNumber}` : aNumber.toString();
};

export const timeUtil = {
    // converts seconds to human readable version of seconds or minutes
    secondsToHumanDescription: (seconds: number): string => {
        const { minutes, remainingSeconds } = secondsToMinutesAndRemainingSeconds(seconds);

        if (minutes === 0) {
            const suffix = seconds > 1 ? 's' : '';
            return `${seconds} second${suffix}`;
        }

        const minuteSuffix = minutes > 1 ? 's' : '';
        const minuteText = `${minutes} minute${minuteSuffix}`;

        const secondsSuffix = remainingSeconds > 1 ? 's' : '';
        const secondsText = remainingSeconds === 0 ? '' : ` ${remainingSeconds} second${secondsSuffix}`;

        return `${minuteText}${secondsText}`;
    },
    // converts seconds to stopwatch time (i.e. 05:30 and 00:30)
    // only goes up to minutes, not hours
    secondsToStopwatchTime: (seconds: number): string => {
        const { minutes, remainingSeconds } = secondsToMinutesAndRemainingSeconds(seconds);
        return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
    },
};
