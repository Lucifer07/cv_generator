<script lang="ts">
	import { Calendar, Popover } from 'bits-ui';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import Fa from 'svelte-fa';
	import { icons } from '$lib/icons';
	import { formatDateLabel, toDateInputValue } from '$lib/utils/dates';

	interface Props {
		id: string;
		label: string;
		value: string;
		disabled?: boolean;
		onchange?: (value: string) => void;
	}

	let { id, label, value = $bindable(''), disabled = false, onchange }: Props = $props();

	let open = $state(false);

	const calendarValue = $derived.by(() => {
		const v = toDateInputValue(value);
		if (!v) return undefined;
		const [y, m, d] = v.split('-').map(Number);
		return new CalendarDate(y, m, d);
	});

	const displayValue = $derived(formatDateLabel(value));

	function handleSelect(date: DateValue) {
		value = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
		onchange?.(value);
		open = false;
	}
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-medium">{label}</label>
	<Popover.Root bind:open>
		<Popover.Trigger>
			<button
				type="button"
				{id}
				{disabled}
				class="inline-flex h-10 w-full items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 text-sm transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:outline disabled:cursor-not-allowed disabled:opacity-50"
			>
				<span class={displayValue ? 'text-ink' : 'text-ink-muted'}>
					{displayValue || 'Select date'}
				</span>
				<Fa icon={icons.calendar} class="h-4 w-4 text-ink-muted" />
			</button>
		</Popover.Trigger>
		<Popover.Content sideOffset={6} align="start" class="z-50">
			<Calendar.Root
				type="single"
				value={calendarValue}
				onValueChange={(d) => d && handleSelect(d)}
				weekdayFormat="short"
				class="rounded-card border border-border bg-surface p-4 shadow-float"
			>
				{#snippet children({ months, weekdays })}
					<Calendar.Header class="flex items-center justify-between">
						<Calendar.PrevButton
							class="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-accent-soft"
							aria-label="Previous month"
						>
							<Fa icon={icons.chevronLeft} class="h-3.5 w-3.5" />
						</Calendar.PrevButton>
						<Calendar.Heading class="text-sm font-semibold" />
						<Calendar.NextButton
							class="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-accent-soft"
							aria-label="Next month"
						>
							<Fa icon={icons.chevronRight} class="h-3.5 w-3.5" />
						</Calendar.NextButton>
					</Calendar.Header>
					<Calendar.Grid class="mt-3">
						<Calendar.GridHead>
							<Calendar.GridRow class="flex">
								{#each weekdays as day (day)}
									<Calendar.HeadCell class="w-9 text-center text-xs text-ink-muted">
										{day.slice(0, 2)}
									</Calendar.HeadCell>
								{/each}
							</Calendar.GridRow>
						</Calendar.GridHead>
						<Calendar.GridBody>
							{#each months as month (month.value)}
								{#each month.weeks as weekDates (weekDates)}
									<Calendar.GridRow class="flex">
										{#each weekDates as date (date)}
											<Calendar.Cell {date} month={month.value} class="p-0">
												<Calendar.Day
													class="inline-flex h-9 w-9 items-center justify-center rounded-control text-sm transition-colors hover:bg-accent-soft data-outside-month:pointer-events-none data-outside-month:opacity-40 data-selected:bg-accent data-selected:text-surface"
												>
													{date.day}
												</Calendar.Day>
											</Calendar.Cell>
										{/each}
									</Calendar.GridRow>
								{/each}
							{/each}
						</Calendar.GridBody>
					</Calendar.Grid>
				{/snippet}
			</Calendar.Root>
		</Popover.Content>
	</Popover.Root>
</div>
