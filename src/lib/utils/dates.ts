const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december'
];

/**
 * Normalize loose date strings produced by AI or imports ("2021-01",
 * "2019", "Jan 2021", "2021/01") into values accepted by
 * <input type="date"> ("2021-01-01"). Returns '' for non-parseable
 * input so the field simply stays empty.
 */
export function toDateInputValue(raw: string): string {
	const v = (raw ?? '').trim();
	if (!v) return '';
	if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
	if (/^\d{4}-\d{2}$/.test(v)) return `${v}-01`;
	if (/^\d{4}$/.test(v)) return `${v}-01-01`;

	const iso = v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
	if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

	const slash = v.match(/^(\d{1,2})[-/](\d{4})$/);
	if (slash) return `${slash[2]}-${slash[1].padStart(2, '0')}-01`;

	const monthFirst = v.match(/^([a-zA-Z]+)\s+(\d{4})$/);
	if (monthFirst) {
		const idx = MONTH_NAMES.indexOf(monthFirst[1].toLowerCase());
		if (idx >= 0) return `${monthFirst[2]}-${String(idx + 1).padStart(2, '0')}-01`;
	}

	const isoWithTime = v.match(/^(\d{4}-\d{2}-\d{2})T/);
	if (isoWithTime) return isoWithTime[1];

	return '';
}

/**
 * Comparable sort key for loose date strings. Current roles sort last
 * (newest). Unparseable dates sort as oldest.
 */
export function dateSortKey(raw: string, current = false): number {
	if (current) return Number.MAX_SAFE_INTEGER;
	const m = (raw ?? '').trim().match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
	if (!m) return 0;
	const year = Number(m[1]);
	const month = m[2] ? Number(m[2]) : 12;
	return year * 12 + month;
}

/**
 * Human label for loose date strings: "2021-01" -> "Jan 2021",
 * "2019" -> "2019". Passes through anything unrecognized.
 */
export function formatDateLabel(raw: string): string {
	const v = (raw ?? '').trim();
	if (!v) return '';
	const m = v.match(/^(\d{4})(?:-(\d{2}))?(?:-\d{2})?$/);
	if (m) {
		if (!m[2]) return m[1];
		const idx = Number(m[2]) - 1;
		return idx >= 0 && idx < 12 ? `${MONTHS[idx]} ${m[1]}` : m[1];
	}

	const monthFirst = v.match(/^([a-zA-Z]+)\s+(\d{4})$/);
	if (monthFirst) {
		const idx = MONTH_NAMES.indexOf(monthFirst[1].toLowerCase());
		if (idx >= 0) return `${MONTHS[idx]} ${monthFirst[2]}`;
	}

	const slash = v.match(/^(\d{1,2})[-/](\d{4})$/);
	if (slash) {
		const idx = Number(slash[1]) - 1;
		return idx >= 0 && idx < 12 ? `${MONTHS[idx]} ${slash[2]}` : slash[2];
	}

	return v;
}
