const { format, lastDayOfMonth, getDay, addDays, isSameDay } = require('date-fns');

/**
 * Finds the last Tuesday of a given month and year.
 * @param {number} year The full year.
 * @param {number} month The month (0-indexed).
 * @returns {Date} The date of the last Tuesday.
 */
function getLastTuesdayOfMonth(year, month) {
    const lastDay = lastDayOfMonth(new Date(year, month));
    let dayOfWeek = getDay(lastDay); // Sunday is 0, Tuesday is 2
    let diff = (dayOfWeek < 2) ? (dayOfWeek + 5) : (dayOfWeek - 2);
    
    lastDay.setDate(lastDay.getDate() - diff);
    return lastDay;
}

/**
 * --- NEW ---
 * Finds the next upcoming Tuesday (for weekly expiries).
 * @param {Date} fromDate The date to start searching from.
 * @returns {Date} The date of the next Tuesday.
 */
function getNextTuesday(fromDate) {
    const TUESDAY = 2; // date-fns uses 0 for Sunday, 2 for Tuesday
    let date = new Date(fromDate);
    let dayOfWeek = getDay(date);
    
    let daysToAdd = (TUESDAY + 7 - dayOfWeek) % 7;

    // If today is Tuesday, it should return today's date.
    if (daysToAdd === 0 && isSameDay(date, new Date())) {
       return date;
    }
    // If today is Tuesday but we want the *next* one, add 7 days. Or for any other day.
    if (daysToAdd === 0) daysToAdd = 7;

    return addDays(date, daysToAdd);
}

/**
 * --- MODIFIED & RENAMED ---
 * Gets the expiry dates based on the provided configuration.
 * @param {object} config The configuration object from config.js.
 * @returns {string[]} An array of expiry dates in 'yyyy-MM-dd' format, sorted by closest date.
 */
function getExpiryDates(config) {
    const expiries = [];
    const today = new Date();
    
    // Get weekly expiry if enabled in config
    if (config.track_weekly_expiry) {
        const nextTuesday = getNextTuesday(today);
        expiries.push(format(nextTuesday, 'yyyy-MM-dd'));
        console.log("-> Configuration: Tracking Weekly Expiry.");
    }
    
    // Get monthly expiries if enabled in config
    if (config.track_monthly_expiry) {
        // Get expiries for the current month and the next two months
        for (let i = 0; i < 3; i++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const lastTuesday = getLastTuesdayOfMonth(targetDate.getFullYear(), targetDate.getMonth());
            
            // Only add future or current expiries
            if (lastTuesday >= today || isSameDay(lastTuesday, today)) {
                const formattedDate = format(lastTuesday, 'yyyy-MM-dd');
                // Avoid adding duplicates if a weekly expiry is also the monthly expiry
                if (!expiries.includes(formattedDate)) {
                    expiries.push(formattedDate);
                }
            }
        }
        console.log("-> Configuration: Tracking Monthly Expiry.");
    }
    
    // Sort the dates to ensure the closest one is first
    return expiries.sort();
}

module.exports = { getExpiryDates }; // <-- MODIFIED: Export the new main function