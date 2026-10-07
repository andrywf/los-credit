import { Platform } from "@core/Platform";
import { routes } from "./routes";
import { matchRoute } from "./matcher";
import { guard } from "./guard";
import { isAuthenticated } from "./auth";
import Sidebar from "@modules/sidebar";

const layoutViews = import.meta.glob("/src/views/layouts/**/*.html", {
	query: "?raw",
	import: "default",
});

const htmlViews = import.meta.glob("/src/views/pages/**/*.html", {
	query: "?raw",
	import: "default",
});

const componentViews = import.meta.glob("/src/views/components/**/*.html", {
	query: "?raw",
	import: "default",
});

const errorViews = import.meta.glob("/src/views/pages/utility/error-pages/*.html", {
	query: "?raw",
	import: "default",
});

const pageModules = import.meta.glob("/src/apps/pages/**/*.ts");
const appModules = import.meta.glob("/src/apps/app.ts");

class Router {
	private current: any = null;
	private container = document.getElementById("app") as HTMLElement;
	private loader = document.getElementById("pageLoader") as HTMLElement;
	private layoutCache = new Map<string, string>();
	private htmlCache = new Map<string, string>();
	private componentCache = new Map<string, string>();
	private moduleCache = new Map<string, any>();
	private contentContainer: HTMLElement | null = null;
	private initialized = false;
	private layoutRendered = false;
	private currentLayoutKey: string | null = null;

	constructor() {
		window.addEventListener("popstate", () => {this.render();});
		document.addEventListener("click", this.onNavigate);
		document.addEventListener("mouseover", this.onPrefetch);

		window.addEventListener("online", () => {
			// Sync.pushToRemote();
			// Sync.pullFromRemote();
		});

		document.addEventListener("layout:ready", () => {
			this.hideLoader();
		});
	}

	public showLoader(): void {
		this.loader?.classList.add("show");
	}

	public hideLoader(): void {
		this.loader?.classList.remove("show");
	}

	navigate(path: string): void {
		history.pushState({}, "", path);
		this.render();
	}

	private onNavigate = (event: MouseEvent): void => {
		const link = (event.target as HTMLElement).closest(
			"a[data-route]"
		) as HTMLAnchorElement | null;

		if (!link) return;

		event.preventDefault();
		this.navigate(link.pathname);
	};

	private getPlatform(): "desktop" | "mobile" {
		return Platform.get();
	}

	private getLayoutPath(layout: string): string {
		const platform = this.getPlatform();
		return `/src/views/layouts/${platform}/${layout}.html`;
	}

	private getLayoutCacheKey(layout: string): string {
		const platform = this.getPlatform();
		return `${platform}:${layout}`;
	}

	private getComponentPath(name: string): string {
		const platform = this.getPlatform();
		return `/src/views/components/${platform}/${name}.html`;
	}

	private getComponentCacheKey(name: string): string {
		const platform = this.getPlatform();
		return `${platform}:${name}`;
	}

	private onPrefetch = (event: MouseEvent): void => {
		const link = (event.target as HTMLElement).closest("a[data-route]") as HTMLAnchorElement | null;

		if (!link) {
			return;
		}

		const route = matchRoute(link.pathname,routes);

		if (!route) {
			return;
		}


		/*
		 * Prefetch layout
		 */
		const layoutPath = this.getLayoutPath(route.layout);

		const layoutCacheKey = this.getLayoutCacheKey(
			route.layout
		);


		if (!this.layoutCache.has(layoutCacheKey)) {

			layoutViews[layoutPath]
				?.()
				.then((layout: any) => {

					this.layoutCache.set(
						layoutCacheKey,
						layout
					);

				});

		}


		/*
		 * Prefetch page HTML
		 */
		if (!this.htmlCache.has(route.page)) {

			htmlViews[`/src/views/pages/${route.page}.html`]
				?.()
				.then((html: any) => {

					this.htmlCache.set(
						route.page,
						html
					);

				});

		}


		/*
		 * Prefetch page module
		 */
		if (!this.moduleCache.has(route.page)) {

			pageModules[`/src/apps/pages/${route.page}.ts`]
				?.()
				.then((module: any) => {

					this.moduleCache.set(
						route.page,
						module
					);

				});

		}

	};

	private async loadComponent(name: string): Promise<string> {

		const componentPath = this.getComponentPath(name);

		const cacheKey = this.getComponentCacheKey(name);


		if (this.componentCache.has(cacheKey)) {

			return this.componentCache.get(cacheKey)!;

		}


		const loader = componentViews[componentPath];


		if (!loader) {

			throw new Error(
				`Component "${componentPath}" tidak ditemukan.`
			);

		}


		const html = await loader();


		this.componentCache.set(
			cacheKey,
			html
		);


		return html;

	}

	private async loadLayout(layoutName: string): Promise<string> {

		const layoutPath = this.getLayoutPath(
			layoutName
		);

		const cacheKey = this.getLayoutCacheKey(
			layoutName
		);


		if (this.layoutCache.has(cacheKey)) {

			return this.layoutCache.get(cacheKey)!;

		}


		const layoutLoader = layoutViews[layoutPath];


		if (!layoutLoader) {

			throw new Error(
				`Layout "${layoutPath}" tidak ditemukan.`
			);

		}

		const layout = await layoutLoader();
		this.layoutCache.set(cacheKey, layout);

		return layout;
	}

	private async loadPage(page: string): Promise<string> {
		if (this.htmlCache.has(page)) {
			return this.htmlCache.get(page)!;
		}

		const htmlLoader = htmlViews[`/src/views/pages/${page}.html`];

		if (!htmlLoader) {
			throw new Error(`View "/src/views/pages/${page}.html" tidak ditemukan.`);
		}


		const html = await htmlLoader();


		this.htmlCache.set(
			page,
			html
		);


		return html;

	}

	private async loadShellComponents(): Promise<{navbar?: string; sidebar?: string; header?: string; bottomNav?: string; }> {
		const platform = this.getPlatform();

		if (platform === "desktop") {
			const navbar = await this.loadComponent("navbar");
			const sidebar = await this.loadComponent("sidebar");

			return {navbar, sidebar};
		}

		const header = await this.loadComponent("header");
		const bottomNav = await this.loadComponent("bottom-nav");

		return {
			header,
			bottomNav,
		};
	}

	private async loadAppModule(): Promise<any> {
		const appLoader = appModules["/src/apps/app.ts"];

		if (!appLoader) {
			return null;
		}

		return (await appLoader()) as {
			default?: {
				mounted?: () => void;
				updated?: () => void;
			};
		};
	}

	async render(): Promise<void> {
		try {
			const route = matchRoute(location.pathname, routes);

			if (!route) {
				await this.notFound();
				return;
			}

			document.title = `${route.title} | AGGRE`;

			const redirect = guard(route);
			if (redirect) {
				history.replaceState({}, "", redirect);
				return this.render();
			}

			if (isAuthenticated()) {
				// await AggreDB.init();

				if (!this.initialized) {
					this.initialized = true;
					// Sync.pullMstMenu();
					// Sync.pushToRemote();
				}
			}

			if (route.style) {
				await route.style();
			}

			const platform = this.getPlatform();


			/*
			 * Layout key
			 *
			 * Example:
			 * desktop:main_layout
			 * mobile:main_layout
			 */
			const layoutKey =
				this.getLayoutCacheKey(
					route.layout
				);


			/*
			 * Load layout
			 */
			const layout =
				await this.loadLayout(
					route.layout
				);

			const shell = await this.loadShellComponents();
			const html =
				await this.loadPage(
					route.page
				);


			/*
			 * Load application module
			 */
			const layoutModules =
				await this.loadAppModule();


			/*
			 * Unmount current page
			 */
			this.current?.unmounted?.();


			/*
			 * Determine whether the shell/layout
			 * needs to be rendered again.
			 */
			const shouldRenderLayout =
				!this.layoutRendered ||
				this.currentLayoutKey !== layoutKey;


			if (shouldRenderLayout) {

				/*
				 * Build layout
				 */
				let renderedLayout = layout;


				/*
				 * Desktop shell
				 */
				if (platform === "desktop") {

					renderedLayout =
						renderedLayout
							.replace(
								"{{renderNavbar}}",
								shell.navbar ?? ""
							)
							.replace(
								"{{renderSidebar}}",
								shell.sidebar ?? ""
							);

				}


				/*
				 * Mobile shell
				 */
				if (platform === "mobile") {

					renderedLayout =
						renderedLayout
							.replace(
								"{{renderHeader}}",
								shell.header ?? ""
							)
							.replace(
								"{{renderBottomNav}}",
								shell.bottomNav ?? ""
							);

				}

				renderedLayout = renderedLayout.replace("{{content}}", html);

				this.container.innerHTML = renderedLayout;
				this.contentContainer = document.getElementById("page-content");

				if (platform === "desktop") {
					await Sidebar.render();
				}

				// this.layoutRendered = true;
				this.currentLayoutKey =layoutKey;
				layoutModules?.default?.mounted?.();
			} else {
				if (this.contentContainer) {
					this.contentContainer.innerHTML = html;
				}

				layoutModules?.default?.updated?.();
				this.hideLoader();
			}

			let module: any;


			if (this.moduleCache.has(route.page)) {

				module =
					this.moduleCache.get(
						route.page
					);

			} else {

				const moduleLoader =
					pageModules[
						`/src/apps/pages/${route.page}.ts`
					];


				if (moduleLoader) {
					module = await moduleLoader();
					this.moduleCache.set(route.page, module);
				}
			}

			this.current = module?.default ?? null;
			this.current?.mounted?.();

			if (shouldRenderLayout) {
				this.hideLoader();
			}
		} finally {
			/*
			 * Reserved for future error handling.
			 */
		}
	}

	private async notFound(): Promise<void> {
		const htmlLoader = errorViews["/src/views/pages/utility/error-pages/404.html"];

		if (!htmlLoader) {
			throw new Error(
				'View "/src/views/pages/utility/error-pages/404.html" tidak ditemukan.'
			);
		}

		this.container.innerHTML = await htmlLoader();
		// this.layoutRendered = false;
		// this.currentLayoutKey = null;
		// this.contentContainer = null;
	}
}

export default new Router();