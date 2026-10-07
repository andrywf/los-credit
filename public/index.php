<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
	return false;
}

if (preg_match('/\.(?:png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|css|js)$/', $uri)) {
	return false;
}

if (strpos($_SERVER['REQUEST_URI'], '/api/') === 0 || strpos($_SERVER['REQUEST_URI'], '/sanctum/') === 0) {
	require __DIR__.'/../vendor/autoload.php';

	$app = require_once __DIR__.'/../bootstrap/app.php';
	$app->handleRequest(\Illuminate\Http\Request::capture());
	exit;
}

$html 		= file_get_contents(__DIR__ . '/../frontend/index.html');
$domain 	= $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
$protocol 	= (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$appUrl 	= $protocol . '://' . $domain;

$viteScripts = '
	<script type="module" src="'.$appUrl.':3410/src/apps/core/desktop/main.ts"></script>
	<script type="module" src="'.$appUrl.':3410/@vite/client"></script>
';
echo str_replace('</body>', $viteScripts . '</body>', $html);