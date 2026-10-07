import type { Route } from "./types";

export const routes: Route[] = [
	{
		path: "/",
		title: "Login",
		layout: "auth_layout",
		guest: true,
		page: "auth/login",
	},
	{
		path: "/forgot-password",
		title: "Forgot Password",
		layout: "auth_layout",
		guest: true,
		page: "auth/forgot-password",
	},
	{
		path: "/dashboard",
		title: "Dashboard",
		layout: "main_layout",
		page: "dashboard/dashboard",
		auth: true
	}
];