# @pacific-wharf/datetime

Dependency-free timestamp formatting utilities for Pacific Wharf projects.

## Install

```bash
npm install @pacific-wharf/datetime
```

## Usage

```js
import { formatUnixTimestamp } from '@pacific-wharf/datetime'

const value = Date.UTC(2026, 2, 31, 21, 5, 7, 42)

formatUnixTimestamp({
    value,
    format: 'yyyy-mm-dd hh:nn:ss.sss Z z zz',
    timezone: 'America/Los_Angeles'
})
// '2026-03-31 14:05:07.042 PDT -0700 -07:00'
```

## API

### `formatUnixTimestamp(opts)`

Formats a Unix timestamp in milliseconds.

```js
formatUnixTimestamp({
    value: Date.now(),
    format: 'yyyy-mm-dd hh:nn:ss',
    timezone: 'UTC'
})
```

Options:

- `value`: Unix timestamp in milliseconds. Defaults to `Date.now()`.
- `format`: output format string. Defaults to `yyyy-mm-dd hh:nn:ss`.
- `timezone`: IANA timezone name. Defaults to `UTC`.

Invalid input returns `'-'` instead of throwing.

## Tokens

Date:

```text
yyyy  four-digit year
yy    two-digit year
mmmm  full month name
mmm   short month name
mm    zero-padded month number
m     month number
dd    zero-padded day of month
d     day of month
```

Time:

```text
hh   zero-padded 24-hour clock
h    24-hour clock
HH   zero-padded 12-hour clock
H    12-hour clock
nn   zero-padded minutes
n    minutes
ss   zero-padded seconds
s    seconds
sss  zero-padded milliseconds
A    uppercase meridiem
a    lowercase meridiem
```

Timezone:

```text
Z   short timezone name, such as UTC or PDT
ZZ  IANA timezone identifier
z   numeric UTC offset, such as -0700
zz  numeric UTC offset, such as -07:00
```

Literal text:

- Text inside double quotes is emitted literally.
- Inside quoted text, `\"` emits a literal double quote.
- Token matching uses longest-token-wins parsing.

## Development

```bash
npm install
npm test
npm run lint
npm run format:check
npm run pack:dry
```
