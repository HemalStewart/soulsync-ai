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
    $routes->get('user-characters', 'Api\UserCharacters::index');
    $routes->post('user-characters', 'Api\UserCharacters::store');
    $routes->put('user-characters/(:num)', 'Api\UserCharacters::update/$1');

    $routes->get('coins', 'Api\Coins::index');

    $routes->get('generated-images', 'Api\GeneratedImages::index');
    $routes->post('generated-images', 'Api\GeneratedImages::store');
    $routes->delete('generated-images', 'Api\GeneratedImages::clear');
    $routes->delete('generated-images/(:num)', 'Api\GeneratedImages::destroy/$1');

    $routes->get('generated-videos', 'Api\GeneratedVideos::index');
    $routes->post('generated-videos', 'Api\GeneratedVideos::store');
    $routes->delete('generated-videos', 'Api\GeneratedVideos::clear');
    $routes->delete('generated-videos/(:num)', 'Api\GeneratedVideos::destroy/$1');

    $routes->get('auth/me', 'Api\Auth::me');
    $routes->post('auth/request-otp', 'Api\Auth::requestOtp');
    $routes->post('auth/verify-otp', 'Api\Auth::verifyOtp');
    $routes->post('auth/register-email', 'Api\Auth::registerEmail');
    $routes->match(['get', 'post'], 'auth/logout', 'Api\Auth::logout');
});

$routes->get('oauth/google', 'OAuth::google');
$routes->get('oauth/google/callback', 'OAuth::googleCallback');
