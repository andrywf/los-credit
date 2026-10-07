<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;

class DatabaseSeeder extends Seeder {
	use WithoutModelEvents;

	public function run(): void {
		$rawKey = random_bytes(32);

		$user = User::firstOrCreate(
			[
				'role_id'	=> '96d0fe69-a7ac-4e07-a874-ab41f2884392',
				'email'		=> 'administrator@aggre.co.id',
				'password'		=> bcrypt('@dmin1straor'),
				'encrypted_key'	=> Crypt::encryptString($rawKey),
			]
		);
	}
}
