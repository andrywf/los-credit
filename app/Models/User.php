<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable {
	use HasFactory, HasUuids, Notifiable, SoftDeletes;

	protected $table = 'mst_users';

	protected $fillable = [
		'email',
		'password',
		'remember_token',
		'email_verified_at',
		'encrypted_key',
		'is_active',
	];

	protected $hidden = [
		'password',
		'remember_token',
		'encrypted_key',
	];

	protected function casts(): array {
		return [
			'email_verified_at' => 'datetime:H:i:s',
			'is_active' => 'boolean',
			'password' => 'hashed',
		];
	}
}