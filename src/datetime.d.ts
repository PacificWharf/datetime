export interface FormatUnixTimestampOptions {
    /**
     * Unix timestamp in milliseconds.
     *
     * Defaults to `Date.now()`.
     */
    value?: number

    /**
     * Token-based output format.
     *
     * Defaults to `yyyy-mm-dd hh:nn:ss`.
     */
    format?: string

    /**
     * IANA timezone name used for formatting.
     *
     * Defaults to `UTC`.
     */
    timezone?: string
}

/**
 * Format a Unix timestamp in milliseconds with a token-based format string.
 *
 * Invalid values return `'-'` instead of throwing.
 */
export function formatUnixTimestamp(opts?: FormatUnixTimestampOptions): string
