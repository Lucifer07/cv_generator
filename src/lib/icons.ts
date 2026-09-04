import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faFileArrowDown } from '@fortawesome/free-solid-svg-icons/faFileArrowDown';
import { faKey } from '@fortawesome/free-solid-svg-icons/faKey';
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faSliders } from '@fortawesome/free-solid-svg-icons/faSliders';
import { faTableCellsLarge } from '@fortawesome/free-solid-svg-icons/faTableCellsLarge';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';

export const icons = {
	dashboard: faTableCellsLarge,
	create: faPlus,
	edit: faPen,
	settings: faSliders,
	ai: faWandMagicSparkles,
	download: faFileArrowDown,
	key: faKey,
	warning: faTriangleExclamation,
	success: faCheck,
	dismiss: faXmark
} as const;

export type IconName = keyof typeof icons;
