<?php

declare(strict_types=1);

namespace App\Modules\v1\Auth\Controllers;

use App\Http\Controllers\Controller;
// use App\Modules\v1\Auth\Services\AuthService;
// use App\Helpers\ValidationHelper;
// use App\Traits\ApiResponser;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller {
	use ApiResponser;

	public function __construct(
		private readonly AuthService $authService,
	) {}

	public function login(Request $request) {
		$throttleKey = Str::lower((string) $request->input('email')) . '|' . $request->ip();

		if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
			$seconds = RateLimiter::availableIn($throttleKey);
			return $this->gagal("Too many login attempts. Please try again in {$seconds} seconds.", 429);
		}

		$validator = Validator::make($request->all(), [
			'email'		=> ['required', 'email'],
			'password'	=> ['required', Password::min(8)->mixedCase()],
		]);

		if ($validator->fails()) {
			RateLimiter::hit($throttleKey, 60);
			return $this->gagal(
				'Validation failed',
				422,
				ValidationHelper::firstErrorOnly($validator->errors()->toArray())
			);
		}

		$email 	= (string) $request->input('email');
		$user	= $this->authService->findUserByEmail($email);

		if (!$user || !Hash::check((string) $request->input('password'), $user->password)) {
			RateLimiter::hit($throttleKey, 60);

			if ($user && RateLimiter::retriesLeft($throttleKey, 5) === 0) {
				$user->update(['is_active' => false]); 
				RateLimiter::clear($throttleKey);
				return $this->gagal('Your account has been disabled due to too many failed password attempts.', 403);
			}

			return $this->gagal('Invalid email or password.', 401);
		}

		if ($user->is_active === false) {
			return $this->gagal('Account disabled. Please contact your administrator.', 403);
		}

		RateLimiter::clear($throttleKey);
		Auth::login($user, $request->boolean('remember'));
		$isSecure = $request->secure();
		$rawKey = bin2hex(Crypt::decryptString($user->encrypted_key));

		$responseData = [
			'rawkey'		=> base64_encode($rawKey),
			'next_route' => '/dashboard',
		];

		if ($isSecure) {
			$request->session()->regenerate();
		} else {
			$user->tokens()->delete();
			$responseData['token'] = $user->createToken('x_token')->plainTextToken;
		}

		return $this->sukses($responseData, 'Login successful', 200, false);
	}

	public function logout(Request $request) {
		$user = Auth::user();

		if ($user) {
			if ($request->secure()) {
				Auth::logout();
				$request->session()->invalidate();
				$request->session()->regenerateToken();
			} else {
				$user->currentAccessToken()->delete();
			}
		}

		return $this->sukses('', 'Logout Web berhasil', 200, false);
	}
}