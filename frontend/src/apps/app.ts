const THEME_KEY = 'bs-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';
const themeIcon = document.getElementById("themeToggle");

function getStoredTheme(): string | null {
	try {
		return localStorage.getItem(THEME_KEY);
	} catch (_) {
		return null;
	}
}

function setStoredTheme(theme: string): void {
	try {
		localStorage.setItem(THEME_KEY, theme);
	} catch (_) {
		// ignore storage errors (e.g., privacy mode)
	}
}

function getPreferredTheme(): string {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
}

function setTheme(theme: string): void {
	if (theme === DARK_THEME) {
		document.documentElement.setAttribute('data-bs-theme', DARK_THEME);

		if (themeIcon) {
			themeIcon.className = "bi bi-sun-fill";
		}
	} else {
		document.documentElement.removeAttribute('data-bs-theme');

		if (themeIcon) {
			themeIcon.className = "bi bi-moon-fill";
		}
	}
}

function getTheme(): string {
	return document.documentElement.getAttribute('data-bs-theme') || LIGHT_THEME;
}

setTheme(getStoredTheme() ?? LIGHT_THEME);

const SIDEBAR_MOBILE_BREAKPOINT = 992;

export default {
	instances: [] as any[],
	mounted(): void {
		this.initTooltips();
		this.initTheme();
	},
	updated(): void {
		this.instances.forEach((tooltip) => tooltip.dispose());
		this.instances = [];
	},
	initTooltips(): void {
		if (typeof window === 'undefined') return;

		const bootstrap = (window as any).bootstrap;

		if (!bootstrap?.Tooltip) {
			console.warn('[Tooltip] window.bootstrap.Tooltip tidak ditemukan — pastikan bootstrap.bundle.min.js sudah dimuat sebelum script ini jalan.');
			return;
		}

		const tooltipTriggerList = document.querySelectorAll<HTMLElement>(
			'[data-bs-toggle="tooltip"]'
		);

		tooltipTriggerList.forEach((tooltipTriggerEl) => {
			const instance = bootstrap.Tooltip.getOrCreateInstance(tooltipTriggerEl);

			this.instances.push(instance);
		});
	},
	initTheme(): void {
		const mql = window.matchMedia('(prefers-color-scheme: light)');

		const handleChange = (e: MediaQueryListEvent) => {
			if (!getStoredTheme()) {
				setTheme(e.matches ? LIGHT_THEME : DARK_THEME);
			}
		};

		if (mql.addEventListener) {
			mql.addEventListener('change', handleChange);
		} else if (mql.addListener) {
			mql.addListener(handleChange);
		}

		this.initThemeToggle();
	},
	initThemeToggle(): void {
		document.querySelectorAll<HTMLElement>('.theme-toggle').forEach((toggle) => {
			this.syncThemeToggleTooltip(toggle);

			toggle.addEventListener('click', (e) => {
				e.preventDefault();
				const newTheme = getTheme() === DARK_THEME ? LIGHT_THEME : DARK_THEME;
				setTheme(newTheme);
				setStoredTheme(newTheme);
				this.syncThemeToggleTooltip(toggle);
			});
		});
	},
	syncThemeToggleTooltip(toggle: HTMLElement): void {
		const bootstrap = (window as any).bootstrap;
		const isDark = getTheme() === DARK_THEME;
		const label = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

		toggle.setAttribute('data-bs-title', label);
		toggle.setAttribute('title', label);

		if (bootstrap?.Tooltip) {
			const instance = bootstrap.Tooltip.getInstance(toggle);
			instance?.setContent({ '.tooltip-inner': label });
		}
	}
};