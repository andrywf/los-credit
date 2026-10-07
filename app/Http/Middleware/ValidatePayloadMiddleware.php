<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use App\Services\EncryptionKeyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Symfony\Component\HttpFoundation\Response;

class ValidatePayloadMiddleware {
	private string $allowedHost;
	private array $allowedSchemes = ['https'];
	private int $allowedPort = 443;

	public function __construct(private readonly EncryptionKeyService $encryptionKeyService) {
		$this->allowedHost = config('app.allowed_host', 'los-credit.test/');
	}

	public function handle(Request $request, Closure $next): Response {
		if ($request->isMethod('OPTIONS') || $request->isMethod('GET')) {
			return $next($request);
		}

		if ($request->is('login', 'api/v1/auth/login')) {
			return $next($request);
		}

		if (!$request->has('payload')) {
			return response()->json([
				'status'  => 'error',
				'message' => 'Access Denied: Invalid data!',
				'code'    => 'UNENCRYPTED_DATA_PROHIBITED'
			], 400);
		}

		try {
			$payload  = $request->input('payload');
			$mainData = is_array($payload) ? $payload : json_decode($payload, true);

			if ($payload) {
				$user = $request->user();

				if ($user) {
					$rawKey = bin2hex(Crypt::decryptString($user->encrypted_key));

					if ($mainData && is_array($mainData)) {
						$this->validatePayloadRecursive($mainData);
					}

					if (isset($mainData['data']) && is_array($mainData['data'])) {
						foreach ($mainData['data'] as $index => $item) {
							if (isset($item['data']) && is_string($item['data'])) {
								$decryptedInner = $this->encryptionKeyService->decrypt($item['data'], $rawKey);

								if ($decryptedInner) {
									$mainData['data'][$index]['data'] = $decryptedInner;
								}
							}
						}
					}

					$request->json()->replace($mainData);
					$request->merge($mainData);
				}
			}

			return $next($request);
		} catch (\Exception $e) {
			return response()->json([
				'status'  => 'error',
				'message' => $e->getMessage(),
				'debug'   => config('app.debug') ? $e->getMessage() : null
			], 422);
		}
	}

	private function validatePayloadRecursive(array &$data, string $path = ''): void {
		foreach ($data as $key => &$value) {
			if (is_array($value)) {
				$this->validatePayloadRecursive($value, $path . '.' . $key);
				continue;
			}

			if ($key === 'url' && is_string($value)) {
				$this->validateUrl($value, $path . '.' . $key);
			}
		}
	}

	private function validateUrl(string $url, string $fieldPath): void {
		$parsed = parse_url($url);
		if (!$parsed) {
			throw new \Exception("Invalid URL format in field: {$fieldPath}");
		}

		$scheme = $parsed['scheme'] ?? '';
		if (!in_array($scheme, $this->allowedSchemes)) {
			throw new \Exception("Protocol not allowed: {$scheme} in field {$fieldPath}");
		}

		$host = $parsed['host'] ?? '';
		if ($host !== $this->allowedHost) {
			throw new \Exception("Domain not allowed: {$host} in field {$fieldPath}");
		}

		if (isset($parsed['port']) && $parsed['port'] !== $this->allowedPort) {
			throw new \Exception("Port not allowed: {$parsed['port']} in field {$fieldPath}");
		}
	}
}