<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\UserModel;
use App\Services\GoogleOAuthService;
use CodeIgniter\HTTP\RedirectResponse;

class OAuth extends BaseController
{
    private GoogleOAuthService $googleService;

    public function __construct()
    {
        $this->googleService = new GoogleOAuthService();
    }

    public function google(): RedirectResponse
    {
        if (! $this->googleService->isConfigured()) {
            return $this->redirectWithError('Google sign-in is not configured yet.');
        }

        $frontendHost = rtrim(env('frontend.baseURL', ''), '/');

        $redirect = $this->request->getGet('redirect');
        if (! is_string($redirect) || $redirect === '') {
            $redirect = $frontendHost ?: site_url();
        }

        if ($frontendHost !== '') {
            $baseHost = parse_url($frontendHost, PHP_URL_HOST);
            $redirectHost = parse_url($redirect, PHP_URL_HOST);
            if (! $redirectHost || ! $baseHost || ! hash_equals($baseHost, (string) $redirectHost)) {
                $redirect = $frontendHost;
            }
        }

        session()->set('google_oauth_redirect', $redirect);

        $state = bin2hex(random_bytes(24));
        session()->set('google_oauth_state', $state);

        $authorizationUrl = $this->googleService->getAuthorizationUrl($state);

        return redirect()->to($authorizationUrl);
    }

    public function googleCallback(): RedirectResponse
    {
        $frontendHost = rtrim(env('frontend.baseURL', ''), '/');
        $redirectTarget = session()->get('google_oauth_redirect') ?: ($frontendHost ?: site_url());
        $expectedState  = session()->get('google_oauth_state');
        session()->remove('google_oauth_redirect');
        session()->remove('google_oauth_state');

        if ($error = $this->request->getGet('error')) {
            return $this->redirectWithError(
                'Google sign-in was cancelled.',
                $redirectTarget
            );
        }

        $returnedState = $this->request->getGet('state');
        if (! $expectedState || ! $returnedState || ! hash_equals((string) $expectedState, (string) $returnedState)) {
            return $this->redirectWithError(
                'Your Google sign-in session expired. Please try again.',
                $redirectTarget
            );
        }

        $code = $this->request->getGet('code');
        if (! is_string($code) || $code === '') {
            return $this->redirectWithError(
                'Google did not return a valid authorization code.',
                $redirectTarget
            );
        }

        try {
            $tokenData = $this->googleService->fetchAccessToken($code);
            $userInfo  = $this->googleService->fetchUserInfo($tokenData['access_token'] ?? '');
        } catch (\Throwable $exception) {
            log_message('error', 'Google OAuth failed: ' . $exception->getMessage());

            return $this->redirectWithError(
                'We could not verify your Google account. Please try again.',
                $redirectTarget
            );
        }

        $email = strtolower(trim((string) ($userInfo['email'] ?? '')));
        if ($email === '') {
            return $this->redirectWithError(
                'Google did not return an email address for your account.',
                $redirectTarget
            );
        }

        $userModel = model(UserModel::class);
        $user      = $userModel->where('email', $email)->first();

        if ($user) {
            if (! empty($user['oauth_provider']) && $user['oauth_provider'] !== 'google') {
                return $this->redirectWithError(
                    'This email is already linked to another sign-in method.',
                    $redirectTarget
                );
            }

            $updates = [
                'oauth_provider' => 'google',
                'oauth_id'       => $userInfo['id'] ?? $user['oauth_id'],
            ];

            if (! empty($userInfo['picture'])) {
                $updates['avatar'] = $userInfo['picture'];
            }

            $userModel->update($user['id'], $updates);
        } else {
            $userId = bin2hex(random_bytes(16));

            $userModel->insert([
                'id'             => $userId,
                'email'          => $email,
                'mobile'         => null,
                'password'       => null,
                'oauth_provider' => 'google',
                'oauth_id'       => $userInfo['id'] ?? null,
                'avatar'         => $userInfo['picture'] ?? null,
                'reg_datetime'   => date('Y-m-d H:i:s'),
                'status'         => 'active',
            ]);

            $user = $userModel->find($userId);
        }

        session()->set([
            'isLoggedIn' => true,
            'user_id'    => $user['id'],
            'email'      => $user['email'],
            'mobile'     => $user['mobile'],
            'provider'   => 'google',
        ]);
        session()->regenerate(true);

        return $this->redirectWithSuccess($redirectTarget);
    }

    private function redirectWithSuccess(string $target): RedirectResponse
    {
        $separator = str_contains($target, '?') ? '&' : '?';

        return redirect()->to($target . $separator . 'auth=google');
    }

    private function redirectWithError(string $message, ?string $target = null): RedirectResponse
    {
        $target ??= (rtrim(env('frontend.baseURL', ''), '/') ?: site_url());
        $separator = str_contains($target, '?') ? '&' : '?';

        return redirect()->to($target . $separator . 'auth_error=' . rawurlencode($message));
    }
}
