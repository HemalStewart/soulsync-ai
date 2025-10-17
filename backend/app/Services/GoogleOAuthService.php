<?php

namespace App\Services;

use App\Exceptions\SomethingWentWrongException;
use Config\OAuth;

class GoogleOAuthService
{
    private OAuth $config;

    public function __construct(?OAuth $config = null)
    {
        $this->config = $config ?? config(OAuth::class);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->config->googleClientId) && ! empty($this->config->googleClientSecret);
    }

    public function getAuthorizationUrl(string $state): string
    {
        if (! $this->isConfigured()) {
            throw new SomethingWentWrongException('Google OAuth is not configured.');
        }

        $params = [
            'response_type' => 'code',
            'client_id' => $this->config->googleClientId,
            'redirect_uri' => $this->getRedirectUri(),
            'scope' => implode(' ', [
                'openid',
                'email',
                'profile',
            ]),
            'state' => $state,
            'prompt' => 'select_account',
            'access_type' => 'offline',
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * @return array<string, mixed>
     */
    public function fetchAccessToken(string $code): array
    {
        $payload = [
            'code' => $code,
            'client_id' => $this->config->googleClientId,
            'client_secret' => $this->config->googleClientSecret,
            'redirect_uri' => $this->getRedirectUri(),
            'grant_type' => 'authorization_code',
        ];

        $ch = curl_init('https://oauth2.googleapis.com/token');

        if ($ch === false) {
            throw new SomethingWentWrongException('Failed to initialize cURL for Google token exchange.');
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
            ],
            CURLOPT_POSTFIELDS => http_build_query($payload),
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new SomethingWentWrongException('Unable to exchange Google authorization code: ' . $error);
        }

        $data = json_decode($response, true);

        if (! is_array($data) || isset($data['error'])) {
            $message = $data['error_description'] ?? $data['error'] ?? 'Unknown error from Google token endpoint.';
            throw new SomethingWentWrongException('Google token exchange failed: ' . $message);
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function fetchUserInfo(string $accessToken): array
    {
        $ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');

        if ($ch === false) {
            throw new SomethingWentWrongException('Failed to initialize cURL for Google user info.');
        }

        curl_setopt_array($ch, [
            CURLOPT_HTTPGET => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $accessToken,
            ],
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new SomethingWentWrongException('Unable to fetch Google profile: ' . $error);
        }

        $data = json_decode($response, true);

        if (! is_array($data) || empty($data['email'])) {
            throw new SomethingWentWrongException('Google profile response missing email address.');
        }

        return $data;
    }

    private function getRedirectUri(): string
    {
        return $this->config->googleRedirectUri ?? site_url('oauth/google/callback');
    }
}

