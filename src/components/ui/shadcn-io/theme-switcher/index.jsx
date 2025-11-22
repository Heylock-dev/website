'use client';;
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const themes = [
	{
		key: 'system',
		icon: Monitor,
		label: 'System theme',
	},
	{
		key: 'light',
		icon: Sun,
		label: 'Light theme',
	},
	{
		key: 'dark',
		icon: Moon,
		label: 'Dark theme',
	},
];

export const ThemeSwitcher = ({
	value,
	onChange,
	defaultValue = 'system',
	className,
}) => {
	const [pickedTheme, setPickedTheme] = useControllableState({
		defaultProp: defaultValue,
		prop: value,
		onChange,
	});
	const [mounted, setMounted] = useState(false);
	const { setTheme } = useTheme();

	const handleThemeClick = useCallback(
		(themeKey) => {
			setPickedTheme(themeKey);
			setTheme(themeKey);
		},
		[setPickedTheme]
	);

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);

		const memorisedTheme = window.localStorage.getItem('theme') || 'system';

		setPickedTheme(memorisedTheme);		
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<div
			className={cn('relative isolate flex items-center h-8 gap-1 bg-background ring-1 ring-border rounded-lg', className)}>
			{themes.map(({ key, icon: Icon, label }) => {
				const isActive = pickedTheme === key;

				return (
					<button
						aria-label={label}
						className="relative h-8 w-8 rounded-full"
						key={key}
						onClick={() => handleThemeClick(key)}
						type="button">
						{isActive && (
							<motion.div
								className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-md bg-secondary"
								layoutId="activeTheme"
								transition={{ type: 'spring', duration: 0.5 }}
							/>
						)}
						<Icon
							className={cn(
								'relative z-10 m-auto h-4 w-4',
								isActive
									? 'text-foreground'
									: 'text-muted-foreground'
							)}
						/>
					</button>
				);
			})}
		</div>
	);
};
