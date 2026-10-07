export const Encrypt = {
	IV_LENGTH: 12,
	async setRawKey(value: string): void {
		const userSessionData = {
			_y_kx_: value
		};

		const root = await navigator.storage.getDirectory();
		const fileHandle = await root.getFileHandle("app_state_dat", { create: true });

		const jsonString = JSON.stringify(userSessionData);
		const encoder = new TextEncoder();
		const binaryData = encoder.encode(jsonString);

		const writable = await fileHandle.createWritable();
		await writable.write(binaryData);
		await writable.close();
	},
	async getRawKey(): string | null {
		const root = await navigator.storage.getDirectory();

		const fileHandle = await root.getFileHandle("app_state_dat");
		const file = await fileHandle.getFile();

		const buffer = await file.arrayBuffer();

		const decoder = new TextDecoder();
		const jsonString = decoder.decode(buffer);
		const dataObjek = JSON.parse(jsonString);

		return await this.deriveKey(dataObjek._y_kx_);
	},
	async clearRawKey(): void {
		const root = await navigator.storage.getDirectory();

		for await (const entry of root.values()) {
			await root.removeEntry(entry.name, { recursive: true });
		}
	},
	base64ToBytes(base64) {
		const binary = atob(base64);
		return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
	},
	bytesToBase64(bytes) {
		return btoa(String.fromCharCode(...bytes));
	},
	async deriveKey(base64MasterKey) {
		const rawKey = this.base64ToBytes(base64MasterKey);

		const baseKey = await crypto.subtle.importKey(
			'raw',
			rawKey,
			'HKDF',
			false,
			['deriveKey']
		);
		const derivedKey = await crypto.subtle.deriveKey({
				name: 'HKDF',
				hash: 'SHA-256',
				salt: new Uint8Array([
					1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
				]),
				info: new TextEncoder().encode('aggre-capital-encryption-key')
			},
			baseKey,
			{
				name: 'AES-GCM',
				length: 256
			},
			true,
			['encrypt', 'decrypt']
		);

		const exported = await crypto.subtle.exportKey('raw', derivedKey);

		return new Uint8Array(exported);
	},
	async encrypt(plaintext, key) {
		const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
		const aesKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
		const encrypted = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			aesKey,
			new TextEncoder().encode(plaintext)
		);

		return {
			iv: this.bytesToBase64(iv),
			ciphertext: this.bytesToBase64(new Uint8Array(encrypted)),
		};
	},
	async decrypt(ivBase64, ciphertextBase64, key) {
		const iv = this.base64ToBytes(ivBase64);
		const encrypted = this.base64ToBytes(ciphertextBase64);

		const aesKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
		const decrypted = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv },
			aesKey,
			encrypted
		);

		return new TextDecoder().decode(new Uint8Array(decrypted));
	},
	async encryptLocalData(plaintext) {
		const key = await this.getRawKey();

		if (!key) throw new Error('Encryption key is unavailable');

		const { iv, ciphertext } = await this.encrypt(plaintext, key);

		return iv + ciphertext;
	},
	async decryptLocalData(combinedBase64) {
		const key = await this.getRawKey();

		if (!key)
			throw new Error('Encryption key is unavailable');

		const buf = this.base64ToBytes(combinedBase64);
		const iv = buf.slice(0, this.IV_LENGTH);
		const encrypted = buf.slice(this.IV_LENGTH);

		return this.decrypt(
			this.bytesToBase64(iv),
			this.bytesToBase64(encrypted),
			key
		);
	},
};

(globalThis as any).Encrypt = Encrypt;

export default Encrypt;