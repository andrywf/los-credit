<?php

declare(strict_types=1);

namespace App\Helpers;

class ValidationHelper {
	public static function firstErrorOnly(array $errors): array {
		$result = [];
		foreach ($errors as $field => $messages) {
			$result[$field] = $messages[0] ?? 'This field is problematic..';
		}
		return $result;
	}
}