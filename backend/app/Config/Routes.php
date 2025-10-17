<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', static function ($routes) {
    $routes->get('characters', 'Api\Characters::index');
    $routes->get('chats', 'Api\Chats::index');
    $routes->get('chats/(:segment)', 'Api\Chats::show/$1');
    $routes->post('chats/(:segment)', 'Api\Chats::send/$1');

    $routes->get('generated-images', 'Api\GeneratedImages::index');
    $routes->post('generated-images', 'Api\GeneratedImages::store');
    $routes->delete('generated-images', 'Api\GeneratedImages::clear');
    $routes->delete('generated-images/(:num)', 'Api\GeneratedImages::destroy/$1');

    $routes->get('auth/me', 'Api\Auth::me');
    $routes->post('auth/request-otp', 'Api\Auth::requestOtp');
    $routes->post('auth/verify-otp', 'Api\Auth::verifyOtp');
    $routes->post('auth/register-email', 'Api\Auth::registerEmail');
    $routes->match(['get', 'post'], 'auth/logout', 'Api\Auth::logout');
});

$routes->get('oauth/google', 'OAuth::google');
$routes->get('oauth/google/callback', 'OAuth::googleCallback');
