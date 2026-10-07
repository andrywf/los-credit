<?php

use Illuminate\Support\Facades\Route;
use App\Modules\v1\Auth\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);
