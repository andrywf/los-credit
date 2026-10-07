import { CONFIG } from '@core/config.js';
import Router from "@router/router";

export const API = {
	getCookie(name) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
		return null;
	},
	async initialized() {
		if (sessionStorage.getItem('csrf_initialized')) {
			return;
		}

		try {
			const response = await fetch('/sanctum/csrf-cookie', { 
				method: 'GET',
				credentials: 'include' 
			});

			if (response.ok) {
				sessionStorage.setItem('csrf_initialized', 'true');
			}
		} catch (error) {
			console.error('GAGAL MENGAMBIL CSRF COOKIE:', error);
		}
	},
	async request(url, options = {}) {
		await this.initialized();
		const fullUrl = url.startsWith('http') ? url : `${CONFIG.API_URL}${url}`;
		
		try {
			if (options.loader !== false) {
				Router.showLoader(options.loadingText || 'Loading...');
			}

			const headers = {
				'Accept': 'application/json',
				...(options.headers || {})
			};

			const tokenCsrf = this.getCookie('XSRF-TOKEN');
			if (tokenCsrf) {
				headers['X-XSRF-TOKEN'] = tokenCsrf;
			}
			options.credentials = 'include';

			let finalBody = options.body;

			if (url !== '/auth/login' && url !== '/auth/register' && options.body) {
				if (!(options.body instanceof FormData)) {
					const plainTextData = JSON.stringify(options.body);

					finalBody = { payload: plainTextData };
				}
			}

			if (!(finalBody instanceof FormData)) {
				headers['Content-Type'] = 'application/json';
			}

			const fetchOptions = {
				method: options.method || 'GET',
				headers: headers,
				body: finalBody instanceof FormData 
						? finalBody 
						: (finalBody ? JSON.stringify(finalBody) : null)
			};

			const response = await fetch(fullUrl, fetchOptions);
			const contentType = response.headers.get('content-type');
			let result;

			if (contentType && contentType.includes('application/json')) {
				result = await response.json();
			} else {
				const text = await response.text();
				return {
					ok: false,
					statusCode: response.status,
					response: {
						message: 'Server tidak tidak merespon format JSON',
						raw: text
					}
				};
			}

			return {
				ok: response.ok,
				statusCode: response.status,
				response: result
			};
		} catch (error) {
			return {
				ok: false,
				statusCode: 500,
				response: {
					status: 'error',
					message: 'Koneksi ke server terputus: ' + error.message
				}
			};
		} finally {
			Router.hideLoader();
		}
	},
	async get(url, options = {}) {
		return await this.request(url, {
			...options,
			method: 'GET',
			headers: { ...options.headers }
		});
	},
	async post(url, body = null, options = {}) {
		return await this.request(url, {
			...options,
			method: 'POST',
			headers: { ...options.headers },
			body: body
		});
	}
};

(globalThis as any).API = API;

export default API;