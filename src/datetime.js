const DEFAULT_FORMAT = 'yyyy-mm-dd hh:nn:ss'
const DEFAULT_TIMEZONE = 'UTC'
const INVALID_OUTPUT = '-'
const TOKEN_PATTERN = /yyyy|mmmm|mmm|sss|ZZ|zz|yy|mm|dd|hh|HH|nn|ss|Z|z|m|d|h|H|n|s|A|a/g
const MONTH_FORMATTERS = {
    short: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }),
    long: new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
}

/**
 * Zero-pad a number to the requested width.
 *
 * @param {number} value - Numeric value.
 * @param {number} width - Desired string width.
 * @returns {string} Zero-padded string.
 */
function pad(value, width) {
    return String(value).padStart(width, '0')
}

/**
 * Safely read a single part from an Intl parts array.
 *
 * @param {Intl.DateTimeFormatPart[]} parts - Intl date parts.
 * @param {string} type - Requested part type.
 * @returns {string | undefined} Matching part value, if present.
 */
function findPart(parts, type) {
    return parts.find((part) => part.type === type)?.value
}

/**
 * Normalize an Intl UTC offset string to the project's token formats.
 *
 * Supported inputs look like:
 * - `GMT`
 * - `GMT+0`
 * - `GMT-7`
 * - `GMT+05:30`
 *
 * @param {string} value - Raw Intl timezone offset string.
 * @returns {{ compact: string, colon: string }} Normalized offsets.
 */
function normalizeOffset(value) {
    const stripped = String(value).replace(/^GMT/, '').replace(/^UTC/, '')

    if (!stripped) {
        return {
            compact: '+0000',
            colon: '+00:00'
        }
    }

    const match = stripped.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/)

    if (!match) {
        return {
            compact: '+0000',
            colon: '+00:00'
        }
    }

    const [, sign, hours, minutes = '00'] = match
    const paddedHours = pad(Number(hours), 2)

    return {
        compact: `${sign}${paddedHours}${minutes}`,
        colon: `${sign}${paddedHours}:${minutes}`
    }
}

/**
 * Build normalized date/time parts for a Unix timestamp in a specific timezone.
 *
 * @param {number} value - Unix timestamp in milliseconds.
 * @param {string} timezone - IANA timezone name.
 * @returns {null | {
 *   year: number,
 *   month: number,
 *   day: number,
 *   hour24: number,
 *   minute: number,
 *   second: number,
 *   millisecond: number,
 *   timezoneShort: string,
 *   offsetCompact: string,
 *   offsetColon: string,
 *   monthShort: string,
 *   monthLong: string
 * }} Normalized date parts, or null when the timezone is invalid.
 */
function getDateParts(value, timezone) {
    try {
        const date = new Date(value)
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        })
        const parts = formatter.formatToParts(date)
        const shortTimezoneFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'short'
        })
        const shortOffsetFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'shortOffset'
        })
        const longOffsetFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'longOffset'
        })

        const year = Number(findPart(parts, 'year'))
        const month = Number(findPart(parts, 'month'))
        const day = Number(findPart(parts, 'day'))
        const hour24 = Number(findPart(parts, 'hour'))
        const minute = Number(findPart(parts, 'minute'))
        const second = Number(findPart(parts, 'second'))
        const monthDate = new Date(Date.UTC(year, month - 1, 1))
        const timezoneShort =
            findPart(shortTimezoneFormatter.formatToParts(date), 'timeZoneName') || ''
        const offsetColonRaw =
            findPart(longOffsetFormatter.formatToParts(date), 'timeZoneName') || ''
        const normalizedLongOffset = normalizeOffset(offsetColonRaw)
        const offsetCompactRaw =
            findPart(shortOffsetFormatter.formatToParts(date), 'timeZoneName') || ''
        const normalizedShortOffset = normalizeOffset(offsetCompactRaw)

        return {
            year,
            month,
            day,
            hour24,
            minute,
            second,
            millisecond: date.getUTCMilliseconds(),
            timezoneShort,
            offsetCompact: normalizedShortOffset.compact,
            offsetColon: normalizedLongOffset.colon,
            monthShort: MONTH_FORMATTERS.short.format(monthDate),
            monthLong: MONTH_FORMATTERS.long.format(monthDate)
        }
    } catch {
        return null
    }
}

/**
 * Render a normalized token map for a resolved timestamp.
 *
 * @param {{
 *   year: number,
 *   month: number,
 *   day: number,
 *   hour24: number,
 *   minute: number,
 *   second: number,
 *   millisecond: number,
 *   timezoneShort: string,
 *   offsetCompact: string,
 *   offsetColon: string,
 *   monthShort: string,
 *   monthLong: string
 * }} parts - Normalized timestamp parts.
 * @param {string} timezone - Resolved IANA timezone name.
 * @returns {Record<string, string>} Token-to-string map.
 */
function buildTokenMap(parts, timezone) {
    const hour12Base = parts.hour24 % 12
    const hour12 = hour12Base === 0 ? 12 : hour12Base

    return {
        yyyy: String(parts.year),
        yy: pad(parts.year % 100, 2),
        mmmm: parts.monthLong,
        mmm: parts.monthShort,
        mm: pad(parts.month, 2),
        m: String(parts.month),
        dd: pad(parts.day, 2),
        d: String(parts.day),
        hh: pad(parts.hour24, 2),
        h: String(parts.hour24),
        HH: pad(hour12, 2),
        H: String(hour12),
        nn: pad(parts.minute, 2),
        n: String(parts.minute),
        ss: pad(parts.second, 2),
        s: String(parts.second),
        sss: pad(parts.millisecond, 3),
        A: parts.hour24 >= 12 ? 'PM' : 'AM',
        a: parts.hour24 >= 12 ? 'pm' : 'am',
        Z: parts.timezoneShort,
        ZZ: timezone,
        z: parts.offsetCompact,
        zz: parts.offsetColon
    }
}

/**
 * Tokenize a date/time format string.
 *
 * Rules:
 * - Token matching uses longest-token-wins.
 * - Anything inside double quotes is emitted literally.
 * - `\"` is only special inside a quoted literal and emits `"`.
 * - Unmatched double quotes make the format invalid.
 *
 * @param {string} format - Format string to tokenize.
 * @returns {null | Array<{ type: 'token', value: string } | { type: 'literal', value: string }>}
 * Tokenized format, or null when invalid.
 */
function tokenizeFormat(format) {
    const tokens = []
    let literal = ''
    let index = 0
    let inLiteral = false

    while (index < format.length) {
        const current = format[index]

        if (inLiteral) {
            if (current === '\\' && format[index + 1] === '"') {
                literal += '"'
                index += 2
            } else if (current === '"') {
                tokens.push({ type: 'literal', value: literal })
                literal = ''
                inLiteral = false
                index += 1
            } else {
                literal += current
                index += 1
            }
        } else if (current === '"') {
            inLiteral = true
            index += 1
        } else {
            TOKEN_PATTERN.lastIndex = index
            const match = TOKEN_PATTERN.exec(format)

            if (match && match.index === index) {
                tokens.push({ type: 'token', value: match[0] })
                index += match[0].length
            } else {
                tokens.push({ type: 'literal', value: current })
                index += 1
            }
        }
    }

    if (inLiteral) {
        return null
    }

    return tokens
}

/**
 * Format a Unix timestamp for template rendering.
 *
 * This helper accepts a Unix timestamp in milliseconds and returns a
 * formatted display string using Studio's render-layer token language.
 * It is intentionally presentation-focused:
 * - it does not parse date strings
 * - it does not mutate or normalize external settings
 * - it never throws for bad caller input
 *
 * Input contract:
 * - `value` must be an integer Unix timestamp in milliseconds
 * - `format` must be a non-empty token string
 * - `timezone` must be a valid IANA timezone name such as `UTC` or
 *   `America/Los_Angeles`
 *
 * Default behavior:
 * - `value` defaults to `Date.now()`
 * - `format` defaults to `yyyy-mm-dd hh:nn:ss`
 * - `timezone` defaults to `UTC`
 *
 * Failure behavior:
 * - invalid timestamps
 * - invalid or blank timezones
 * - invalid format values
 * - unmatched quote literals
 *
 * all return `'-'` instead of throwing, so templates can safely render
 * without defensive try/catch logic.
 *
 * Supported tokens:
 *
 * Date:
 * - `yyyy` four-digit year
 * - `yy` two-digit year
 * - `mmmm` full month name, e.g. `March`
 * - `mmm` short month name, e.g. `Mar`
 * - `mm` month number with leading zero
 * - `m` month number without leading zero
 * - `dd` day of month with leading zero
 * - `d` day of month without leading zero
 *
 * Time:
 * - `hh` 24-hour clock with leading zero
 * - `h` 24-hour clock without leading zero
 * - `HH` 12-hour clock with leading zero
 * - `H` 12-hour clock without leading zero
 * - `nn` minutes with leading zero
 * - `n` minutes without leading zero
 * - `ss` seconds with leading zero
 * - `s` seconds without leading zero
 * - `sss` milliseconds with leading zero padding to three digits
 * - `A` uppercase meridiem, `AM` or `PM`
 * - `a` lowercase meridiem, `am` or `pm`
 *
 * Timezone:
 * - `Z` short timezone name for the formatted instant, e.g. `UTC`, `PDT`
 * - `ZZ` raw IANA timezone identifier passed into the formatter
 * - `z` numeric UTC offset without a colon, e.g. `-0700`
 * - `zz` numeric UTC offset with a colon, e.g. `-07:00`
 *
 * Literal text:
 * - Use double quotes to insert literal text directly into the output
 * - Inside a quoted literal, `\"` inserts a literal double quote
 * - Token matching uses longest-token-wins parsing
 * - Any character outside a token or quoted literal is copied through as-is
 *
 * @example
 * formatUnixTimestamp({
 *   value: Date.UTC(2026, 2, 31, 21, 5, 7, 42)
 * })
 * // '2026-03-31 21:05:07'
 *
 * @example
 * formatUnixTimestamp({
 *   value: Date.UTC(2026, 2, 31, 21, 5, 7, 42),
 *   format: 'mmmm d, yyyy "at" HH:nn a',
 *   timezone: 'UTC'
 * })
 * // 'March 31, 2026 at 09:05 pm'
 *
 * @example
 * formatUnixTimestamp({
 *   value: Date.UTC(2026, 2, 31, 21, 5, 7, 42),
 *   format: 'yyyy-mm-dd hh:nn:ss.sss Z z zz',
 *   timezone: 'America/Los_Angeles'
 * })
 * // '2026-03-31 14:05:07.042 PDT -0700 -07:00'
 *
 * @example
 * formatUnixTimestamp({
 *   value: Date.UTC(2026, 2, 31, 21, 5, 7, 42),
 *   format: 'yyyy-mm-dd "\\"UTC\\""',
 *   timezone: 'UTC'
 * })
 * // '2026-03-31 "UTC"'
 *
 * @example
 * formatUnixTimestamp({
 *   value: 'not-a-timestamp',
 *   timezone: 'UTC'
 * })
 * // '-'
 *
 * @param {{
 *   value?: number,
 *   format?: string,
 *   timezone?: string
 * }} [opts={}] - Formatting options.
 * @returns {string} Formatted timestamp, or `'-'` when invalid.
 */
export function formatUnixTimestamp(opts = {}) {
    const { value = Date.now(), format = DEFAULT_FORMAT, timezone = DEFAULT_TIMEZONE } = opts

    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        return INVALID_OUTPUT
    }

    if (typeof timezone !== 'string' || !timezone.trim()) {
        return INVALID_OUTPUT
    }

    if (typeof format !== 'string' || !format) {
        return INVALID_OUTPUT
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return INVALID_OUTPUT
    }

    const tokenizedFormat = tokenizeFormat(format)

    if (!tokenizedFormat) {
        return INVALID_OUTPUT
    }

    const parts = getDateParts(value, timezone)

    if (!parts) {
        return INVALID_OUTPUT
    }

    const tokenMap = buildTokenMap(parts, timezone)

    return tokenizedFormat
        .map((part) => (part.type === 'token' ? tokenMap[part.value] : part.value))
        .join('')
}
