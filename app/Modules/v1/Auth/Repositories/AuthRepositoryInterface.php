<?php

declare(strict_types=1);

namespace App\Modules\v1\Auth\Repositories;

use App\Models\User;

interface AuthRepositoryInterface {
	public function findByEmail(string $email): ?User;
}