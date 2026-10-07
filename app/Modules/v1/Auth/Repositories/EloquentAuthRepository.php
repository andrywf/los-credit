<?php

declare(strict_types=1);

namespace App\Modules\v1\Auth\Repositories;

use App\Models\User;

class EloquentAuthRepository implements AuthRepositoryInterface {
	public function findByEmail(string $email): ?User {
		return User::where('email', $email)->first();
	}
}
