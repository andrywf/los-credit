<?php

declare(strict_types=1);

namespace App\Modules\v1\Auth\Services;

use App\Modules\v1\Auth\Repositories\AuthRepositoryInterface;
use App\Models\User;

class AuthService {
	public function __construct(
		private readonly AuthRepositoryInterface $authRepository
	) {}

	public function findUserByEmail(string $email): ?User {
		return $this->authRepository->findByEmail($email);
	}
}