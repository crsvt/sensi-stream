const { format, lastDayOfMonth, getDay } = require('date-fns');

/**
 * Finds the last Thursday of a given month and year.
 * @param {number} year The full year.
 * @param {number} month The month (0-indexed, e.g., 0 for January).
 * @returns {Date} The date of the last Thursday.
 */
function getLastThursdayOfMonth(year, month) {
    const lastDay = lastDayOfMonth(new Date(year, month));
    let dayOfWeek = getDay(lastDay); // Sunday is 0, Thursday is 4

    // Calculate the difference to the previous Thursday
    let diff = (dayOfWeek < 4) ? (dayOfWeek + 3) : (dayOfWeek - 4);
    
    lastDay.setDate(lastDay.getDate() - diff);
    return lastDay;
}

/**
 * Gets the monthly expiry dates for the next few months.
 * @returns {string[]} An array of expiry dates in 'yyyy-MM-dd' format.
 */
function getMonthlyExpiries() {
    const expiries = [];
    const today = new Date();
    
    // Get expiries for the current month and the next two months
    for (let i = 0; i < 3; i++) {
        const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const lastThursday = getLastThursdayOfMonth(targetDate.getFullYear(), targetDate.getMonth());
        
        // Only add future or current expiries
        if (lastThursday >= today || format(lastThursday, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            expiries.push(format(lastThursday, 'yyyy-MM-dd'));
        }
    }
    return expiries;
}

module.exports = { getMonthlyExpiries };