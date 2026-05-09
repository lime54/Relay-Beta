'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

const MONTHS = [
    { value: '', label: 'Month' },
    { value: '01', label: 'Jan' },
    { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' },
    { value: '05', label: 'May' },
    { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' },
    { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
]

function generateYears() {
    const currentYear = new Date().getFullYear()
    const years: { value: string; label: string }[] = [{ value: '', label: 'Year' }]
    for (let y = currentYear + 4; y >= currentYear - 50; y--) {
        years.push({ value: String(y), label: String(y) })
    }
    return years
}

const YEARS = generateYears()

function getDaysInMonth(year: string, month: string): number {
    if (!year || !month) return 31
    return new Date(parseInt(year), parseInt(month), 0).getDate()
}

interface MonthYearPickerProps {
    /** The hidden input name submitted with the form */
    name: string
    required?: boolean
    /** Initial value — accepts "YYYY", "YYYY-MM", or "YYYY-MM-DD" */
    defaultValue?: string
    className?: string
    disabled?: boolean
}

/**
 * Parse an existing date string into day/month/year parts.
 * Handles: "2024", "2024-06", "2024-06-15"
 */
function parseDateValue(value?: string): { day: string; month: string; year: string } {
    if (!value) return { day: '', month: '', year: '' }
    const parts = value.split('-')
    const year = parts[0] || ''
    const month = parts[1] || ''
    const day = parts[2] || ''
    return { day, month, year }
}

/**
 * Build the value to store:
 *  - "YYYY-MM-DD" if all three provided
 *  - "YYYY-MM-01" if month provided but no day
 *  - "YYYY-01-01" if year only
 */
function buildDateValue(year: string, month: string, day: string): string {
    if (!year) return ''
    if (month && day) return `${year}-${month}-${day.padStart(2, '0')}`
    if (month) return `${year}-${month}-01`
    return `${year}-01-01`
}

export function MonthYearPicker({
    name,
    required = false,
    defaultValue,
    className,
    disabled = false,
}: MonthYearPickerProps) {
    const initial = parseDateValue(defaultValue)
    const [month, setMonth] = useState(initial.month)
    const [year, setYear] = useState(initial.year)
    const [day, setDay] = useState(initial.day)

    const composedValue = buildDateValue(year, month, day)

    const maxDays = useMemo(() => getDaysInMonth(year, month), [year, month])

    // Generate day options based on the selected month/year
    const dayOptions = useMemo(() => {
        const opts: { value: string; label: string }[] = [{ value: '', label: 'Day' }]
        for (let d = 1; d <= maxDays; d++) {
            opts.push({ value: String(d).padStart(2, '0'), label: String(d) })
        }
        return opts
    }, [maxDays])

    // If the selected day exceeds the new max, reset it
    if (day && parseInt(day) > maxDays) {
        setDay('')
    }

    const selectClasses = cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors',
        'focus:outline-none focus:ring-1 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>option]:bg-background [&>option]:text-foreground'
    )

    return (
        <div className={cn('flex gap-1.5', className)}>
            {/* Hidden input that holds the actual value for form submission */}
            <input type="hidden" name={name} value={composedValue} />

            {/* Month select (optional) */}
            <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={disabled}
                className={cn(selectClasses, 'flex-[3]', !month && 'text-muted-foreground')}
                aria-label="Month"
            >
                {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                        {m.label}
                    </option>
                ))}
            </select>

            {/* Day select (optional, only meaningful if month is selected) */}
            <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={disabled || !month}
                className={cn(selectClasses, 'flex-[2]', !day && 'text-muted-foreground')}
                aria-label="Day"
            >
                {dayOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                        {d.label}
                    </option>
                ))}
            </select>

            {/* Year select (required when the overall field is required) */}
            <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={disabled}
                required={required}
                className={cn(selectClasses, 'flex-[3]', !year && 'text-muted-foreground')}
                aria-label="Year"
            >
                {YEARS.map((y) => (
                    <option key={y.value} value={y.value}>
                        {y.label}
                    </option>
                ))}
            </select>
        </div>
    )
}
