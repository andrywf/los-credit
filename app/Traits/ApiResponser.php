<?php

declare(strict_types=1);

namespace App\Traits;

Use App\Services\EncryptionKeyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

trait ApiResponser {
	protected function sukses(mixed $data, string $pesan = 'Succeed', int $code = 200, bool $encrypt = false): JsonResponse {

		if ($encrypt && auth()->check()) {
			$encryptionKeyService = app(EncryptionKeyService::class);

			$encrypted_key 	= auth()->user()->encrypted_key;
			$rawKey 		= bin2hex(Crypt::decryptString($encrypted_key));
			$payload = [
				'payload'		=> $encryptionKeyService->encrypt( json_encode($data), $rawKey),
				'server_time'	=> Carbon::now()->timestamp
			];
		} else {
			$payload = [
				'payload'		=> $data,
				'server_time'	=> Carbon::now()->timestamp
			];
		}

		return response()->json([
			'status'	=> 'success',
			'message'	=> $pesan,
			'data'		=> $payload,
		], $code);
	}

	protected function gagal(string $pesan, int $code = 400, mixed $errors = null): JsonResponse {
		$payload = $errors;

		return response()->json([
			'status'	=> 'failed',
			'message'	=> $pesan,
			'errors'	=> $payload,
		], $code);
	}
}