import { jest } from '@jest/globals'
import { formatUnixTimestamp } from '../src/datetime.js'

const SAMPLE_UTC_TIMESTAMP = Date.UTC(2026, 2, 31, 21, 5, 7, 42)

describe('formatUnixTimestamp', () => {
    test('uses UTC defaults when called with no options object', () => {
        expect(formatUnixTimestamp()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    test('uses default value and default format when omitted', () => {
        const result = formatUnixTimestamp({ timezone: 'UTC' })

        expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    test.each([
        [{ value: '123', timezone: 'UTC' }, '-'],
        [{ value: 123.45, timezone: 'UTC' }, '-'],
        [{ value: Number.NaN, timezone: 'UTC' }, '-'],
        [{ value: 8640000000000001, timezone: 'UTC' }, '-'],
        [{ value: SAMPLE_UTC_TIMESTAMP, timezone: '' }, '-'],
        [{ value: SAMPLE_UTC_TIMESTAMP, timezone: 'Bad/Timezone' }, '-'],
        [{ value: SAMPLE_UTC_TIMESTAMP, timezone: 'UTC', format: '' }, '-'],
        [{ value: SAMPLE_UTC_TIMESTAMP, timezone: 'UTC', format: false }, '-'],
        [{ value: SAMPLE_UTC_TIMESTAMP, timezone: 'UTC', format: 'yyyy-mm-dd "oops' }, '-']
    ])('returns "-" for invalid input: %p', (input, expected) => {
        expect(formatUnixTimestamp(input)).toBe(expected)
    })

    test.each([
        ['yyyy', '2026'],
        ['yy', '26'],
        ['mmmm', 'March'],
        ['mmm', 'Mar'],
        ['mm', '03'],
        ['m', '3'],
        ['dd', '31'],
        ['d', '31'],
        ['hh', '21'],
        ['h', '21'],
        ['HH', '09'],
        ['H', '9'],
        ['nn', '05'],
        ['n', '5'],
        ['ss', '07'],
        ['s', '7'],
        ['sss', '042'],
        ['A', 'PM'],
        ['a', 'pm'],
        ['Z', 'UTC'],
        ['ZZ', 'UTC'],
        ['z', '+0000'],
        ['zz', '+00:00']
    ])('formats token `%s` in UTC', (format, expected) => {
        expect(formatUnixTimestamp({ value: SAMPLE_UTC_TIMESTAMP, format, timezone: 'UTC' })).toBe(
            expected
        )
    })

    test('applies timezone conversion before formatting tokens', () => {
        expect(
            formatUnixTimestamp({
                value: SAMPLE_UTC_TIMESTAMP,
                format: 'yyyy-mm-dd hh:nn:ss.sss Z z zz',
                timezone: 'America/Los_Angeles'
            })
        ).toBe('2026-03-31 14:05:07.042 PDT -0700 -07:00')
    })

    test.each([
        ['yyyy-mm-dd hh:nn:ss', '2026-03-31 21:05:07'],
        ['mmmm d, yyyy', 'March 31, 2026'],
        ['mmm d, yy', 'Mar 31, 26'],
        ['yyyy-mm-dd HH:nn A', '2026-03-31 09:05 PM'],
        ['yyyy-mm-dd HH:nn a', '2026-03-31 09:05 pm'],
        ['yyyy-mm-dd H:nn A', '2026-03-31 9:05 PM'],
        ['yyyy-mm-dd hh:nn:ss Z "in" ZZ', '2026-03-31 21:05:07 UTC in UTC']
    ])('formats composite string %s', (format, expected) => {
        expect(formatUnixTimestamp({ value: SAMPLE_UTC_TIMESTAMP, format, timezone: 'UTC' })).toBe(
            expected
        )
    })

    test('uses longest-token-wins parsing', () => {
        expect(
            formatUnixTimestamp({
                value: SAMPLE_UTC_TIMESTAMP,
                format: 'yyyy mmmm mmm mm m sss ss s ZZ zz z Z',
                timezone: 'UTC'
            })
        ).toBe('2026 March Mar 03 3 042 07 7 UTC +00:00 +0000 UTC')
    })

    test.each([
        ['yyyy-mm-dd "at" hh:nn:ss', '2026-03-31 at 21:05:07'],
        ['yyyy-mm-dd "UTC"', '2026-03-31 UTC'],
        ['yyyy-mm-dd "\\"UTC\\""', '2026-03-31 "UTC"']
    ])('renders quoted literals in format %s', (format, expected) => {
        expect(formatUnixTimestamp({ value: SAMPLE_UTC_TIMESTAMP, format, timezone: 'UTC' })).toBe(
            expected
        )
    })

    test.each([
        [Date.UTC(2026, 2, 31, 0, 15, 0, 0), 'HH:nn A', '12:15 AM'],
        [Date.UTC(2026, 2, 31, 0, 15, 0, 0), 'HH:nn a', '12:15 am'],
        [Date.UTC(2026, 2, 31, 12, 15, 0, 0), 'HH:nn A', '12:15 PM'],
        [Date.UTC(2026, 2, 31, 12, 15, 0, 0), 'HH:nn a', '12:15 pm'],
        [Date.UTC(2026, 2, 31, 13, 15, 0, 0), 'H:nn A', '1:15 PM']
    ])('formats 12-hour edge case: %s', (value, format, expected) => {
        expect(formatUnixTimestamp({ value, format, timezone: 'UTC' })).toBe(expected)
    })

    test('falls back safely when Intl offset names are empty or malformed', () => {
        const dateTimeFormatSpy = jest
            .spyOn(Intl, 'DateTimeFormat')
            .mockImplementation((_, opts) => {
                const timeZoneName = opts?.timeZoneName

                if (timeZoneName === 'short') {
                    return {
                        formatToParts: () => [{ type: 'timeZoneName', value: 'UTC' }]
                    }
                }

                if (timeZoneName === 'shortOffset') {
                    return {
                        formatToParts: () => [{ type: 'timeZoneName', value: 'GMT' }]
                    }
                }

                if (timeZoneName === 'longOffset') {
                    return {
                        formatToParts: () => [{ type: 'timeZoneName', value: 'weird-offset' }]
                    }
                }

                return {
                    formatToParts: () => [
                        { type: 'year', value: '2026' },
                        { type: 'month', value: '03' },
                        { type: 'day', value: '31' },
                        { type: 'hour', value: '21' },
                        { type: 'minute', value: '05' },
                        { type: 'second', value: '07' }
                    ]
                }
            })

        expect(
            formatUnixTimestamp({
                value: SAMPLE_UTC_TIMESTAMP,
                format: 'z zz',
                timezone: 'UTC'
            })
        ).toBe('+0000 +00:00')

        dateTimeFormatSpy.mockRestore()
    })

    test('falls back safely when Intl timezone parts omit timeZoneName entirely', () => {
        const dateTimeFormatSpy = jest
            .spyOn(Intl, 'DateTimeFormat')
            .mockImplementation((_, opts) => {
                const timeZoneName = opts?.timeZoneName

                if (
                    timeZoneName === 'short' ||
                    timeZoneName === 'shortOffset' ||
                    timeZoneName === 'longOffset'
                ) {
                    return {
                        formatToParts: () => []
                    }
                }

                return {
                    formatToParts: () => [
                        { type: 'year', value: '2026' },
                        { type: 'month', value: '03' },
                        { type: 'day', value: '31' },
                        { type: 'hour', value: '21' },
                        { type: 'minute', value: '05' },
                        { type: 'second', value: '07' }
                    ]
                }
            })

        expect(
            formatUnixTimestamp({
                value: SAMPLE_UTC_TIMESTAMP,
                format: 'Z z zz',
                timezone: 'UTC'
            })
        ).toBe(' +0000 +00:00')

        dateTimeFormatSpy.mockRestore()
    })
})
