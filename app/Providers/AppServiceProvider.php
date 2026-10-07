<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider {
	public function register(): void {
		$appPath = str_replace('\\', '/', app_path());
		$interfaces = glob($appPath . '/Modules/*/*/Repositories/*Interface.php');

		foreach ($interfaces as $file) {
			$normalizedFile = str_replace('\\', '/', $file);
			$relativePath = str_replace($appPath . '/', '', $normalizedFile);

			$interface = 'App\\' . str_replace(
				['/', '.php'],
				['\\', ''],
				$relativePath
			);

			$baseName = str_replace('Interface', '', class_basename($interface));
			$namespace = dirname(str_replace('\\', '/', $interface));
			$namespace = str_replace('/', '\\', $namespace);

			$implementation = $namespace . '\\Eloquent' . $baseName;

			if (class_exists($implementation)) {
				$this->app->bind($interface, $implementation);
			}
		}
	}

	public function boot(): void {

	}
}
