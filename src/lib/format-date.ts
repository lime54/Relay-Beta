/**
 * Format a flexible date string for display.
 * Handles "YYYY-01-01" (year only), "YYYY-MM-01" (month+year),
 * and full "YYYY-MM-DD" dates.
 *
 * Heuristic:
 *  - Day = "01" → treated as not explicitly set (don't show day)
 *  - Month = "01" and Day = "01" → treated as year-only
 *  - Any other month → show month
 *  - Day > 01 → show day too
 *
 * @param dateStr - A date string like "2024", "2024-06-01", "2024-06-15"
 */
export function formatFlexibleDate(dateStr: string): string {
    if (!dateStr) return ''

    // Handle bare year like "2024"
    if (/^\d{4}$/.test(dateStr)) {
        return dateStr
    }

    const parts = dateStr.split('-')
    const year = parts[0]
    const month = parts[1] || ''
    const day = parts[2] || ''

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const monthIndex = month ? parseInt(month, 10) - 1 : -1
    const dayNum = day ? parseInt(day, 10) : 0
    const hasExplicitMonth = monthIndex >= 0 && monthIndex < 12 && !(month === '01' && day === '01')
    const hasExplicitDay = dayNum > 1

    if (!hasExplicitMonth) {
        return year
    }

    if (hasExplicitDay) {
        return `${monthNames[monthIndex]} ${dayNum}, ${year}`
    }

    return `${monthNames[monthIndex]} ${year}`
}
