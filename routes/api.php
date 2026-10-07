<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
	Route::prefix('auth')->group(base_path('app/Modules/v1/Auth/Routes/api.php'));
});
