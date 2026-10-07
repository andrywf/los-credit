<?php

declare(strict_types=1);

namespace App\Services;

class EncryptionKeyService {
	private const CIPHER 		= 'aes-256-gcm';
	private const IV_LENGTH 	= 12;
	private const TAG_LENGTH 	= 16;
	private const HKDF_HASH 	= 'sha256';
	private const HKDF_LENGTH 	= 32;
	private const HKDF_INFO 	= 'aggre-capital-encryption-key';
	private const HKDF_SALT 	= "\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F\x10";

	public function deriveKey(string $masterKey): string {
		$key = hash_hkdf(
			self::HKDF_HASH,
			$masterKey,
			self::HKDF_LENGTH,
			self::HKDF_INFO,
			self::HKDF_SALT
		);

		return hex2bin(bin2hex($key));
	}

	public function encrypt(string $plaintext, string $masterKey): string {
		$key 	= $this->deriveKey($masterKey);
		$iv 	= random_bytes(self::IV_LENGTH);
		$tag 	= '';

		$ciphertext = openssl_encrypt(
			$plaintext,
			self::CIPHER,
			$key,
			OPENSSL_RAW_DATA,
			$iv,
			$tag,
			'',
			self::TAG_LENGTH
		);

		if ($ciphertext === false) {
			throw new \RuntimeException('encrypt failed');
		}

		return base64_encode($iv . $ciphertext . $tag);
	}

	public function decrypt(string $payload, string $masterKey): string {
		$key = $this->deriveKey($masterKey);

		$data = base64_decode($payload, true);

		if ($data === false) {
			throw new \RuntimeException('base64 invalid');
		}

		if (strlen($data) < (self::IV_LENGTH + self::TAG_LENGTH)) {
			throw new \RuntimeException('payload corrupted');
		}

		$iv 		= substr($data, 0, self::IV_LENGTH);
		$tag 		= substr($data, -self::TAG_LENGTH);
		$ciphertext = substr(
			$data,
			self::IV_LENGTH,
			strlen($data) - self::IV_LENGTH - self::TAG_LENGTH
		);

		$result 	= openssl_decrypt(
			$ciphertext,
			self::CIPHER,
			$key,
			OPENSSL_RAW_DATA,
			$iv,
			$tag
		);

		if ($result === false) {
			throw new \RuntimeException('decrypt failed: integrity check failed');
		}

		return $result;
	}
}