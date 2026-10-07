import Router from "@router/router";

export default {
	formData: {} as Record<string, string>,
	mounted(): void {
		const form = document.querySelector("#forgot-form") as HTMLElement;
		form?.addEventListener("submit", async (e) => {
			e.preventDefault();

			Router.showLoader();

		});
	},
};