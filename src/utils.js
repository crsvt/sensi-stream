const { format, lastDayOfMonth, getDay } = require('date-fns');

/**
 * Finds the last Tuesday of a given month and year.
 * @param {number} year The full year.
 * @param {number} month The month (0-indexed, e.g., 0 for January).
 * @returns {Date} The date of the last Tuesday.
 */
function getLastTuesdayOfMonth(year, month) {
    const lastDay = lastDayOfMonth(new Date(year, month));
    let dayOfWeek = getDay(lastDay); // Sunday is 0, Tuesday is 2

    // Calculate the difference to the previous Tuesday
    // The number '2' represents Tuesday
    let diff = (dayOfWeek < 2) ? (dayOfWeek + 5) : (dayOfWeek - 2);
    
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
        // --- MODIFIED: Changed this to call the new Tuesday function ---
        const lastTuesday = getLastTuesdayOfMonth(targetDate.getFullYear(), targetDate.getMonth());
        
        // Only add future or current expiries
        if (lastTuesday >= today || format(lastTuesday, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            expiries.push(format(lastTuesday, 'yyyy-MM-dd'));
        }
    }
    return expiries;
}

module.exports = { getMonthlyExpiries };