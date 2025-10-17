<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class OAuth extends BaseConfig
{
    public string $googleClientId;
    public string $googleClientSecret;
    public ?string $googleRedirectUri;

    public function __construct()
    {
        $this->googleClientId = getenv('google.clientId') ?: getenv('GOOGLE_CLIENT_ID') ?: '';
        $this->googleClientSecret = getenv('google.clientSecret') ?: getenv('GOOGLE_CLIENT_SECRET') ?: '';
        $this->googleRedirectUri = getenv('google.redirectUri') ?: getenv('GOOGLE_REDIRECT_URI') ?: null;
    }
}

