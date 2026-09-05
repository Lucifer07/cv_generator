/**
 * Normalize loose date strings produced by AI ("2021-01", "2019") into
 * values accepted by <input type="date"> ("2021-01-01"). Returns '' for
 * non-parseable input so the field simply stays empty.
 */
export function toDateInputValue(raw: string): string {
	const v = (raw ?? '').trim();
	if (!v) return '';
	if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
	if (/^\d{4}-\d{2}$/.test(v)) return `${v}-01`;
	if (/^\d{4}$/.test(v)) return `${v}-01-01`;
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Human label for loose date strings: "2021-01" -> "Jan 2021",
 * "2019" -> "2019". Passes through anything unrecognized.
 */
export function formatDateLabel(raw: string): string {
	const v = (raw ?? '').trim();
	if (!v) return '';
	const m = v.match(/^(\d{4})(?:-(\d{2}))?(?:-\d{2})?$/);
	if (!m) return v;
	if (!m[2]) return m[1];
	const idx = Number(m[2]) - 1;
	return idx >= 0 && idx < 12 ? `${MONTHS[idx]} ${m[1]}` : m[1];
}
