<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class Auth extends BaseController
{
    use ResponseTrait;

    private string $apiUrl = 'https://lakminiint.com/ideamart/bytehub/ReCon/middleWare/requestManager.php';
    private string $appId  = '23';

    public function requestOtp()
    {
        $payload  = $this->request->getJSON(true) ?? $this->request->getPost();
        $mobile   = trim((string) ($payload['mobile'] ?? ''));
        $password = trim((string) ($payload['password'] ?? ''));

        if ($mobile === '' || $password === '') {
            return $this->failValidationErrors([
                'mobile'   => 'Mobile number is required.',
                'password' => 'Password is required.',
            ]);
        }

        $response = $this->callApi([
            'funName' => 'requestOTP',
            'app_id'  => $this->appId,
            'mobile'  => $mobile,
        ]);

        if (! isset($response->response)) {
            return $this->fail('Unable to reach OTP server.');
        }

        $userModel = model(UserModel::class);
        $user      = $userModel->where('mobile', $mobile)->first();
        $remoteStatus = $response->response;

        if ($remoteStatus === 'Exist') {
            if (! $user || empty($user['password']) || ! password_verify($password, (string) ($user['password'] ?? ''))) {
                return $this->fail('Invalid mobile number or password.', 401);
            }

            session()->set([
                'isLoggedIn' => true,
                'user_id'    => $user['id'],
                'mobile'     => $user['mobile'],
                'email'      => $user['email'],
                'provider'   => $user['oauth_provider'] ?? 'mobile',
            ]);
            session()->regenerate(true);

            return $this->respond([
                'status'   => 'success',
                'mode'     => 'login',
                'response' => 'Exist',
                'message'  => 'Welcome back! You are now signed in.',
                'user'     => [
                    'id'       => $user['id'],
                    'mobile'   => $user['mobile'],
                    'email'    => $user['email'],
                    'provider' => $user['oauth_provider'] ?? 'mobile',
                ],
            ]);
        }

        if ($remoteStatus === 'Success') {
            $reference = $response->data->referenceNo
                ?? $response->referenceNo
                ?? $response->reference
                ?? null;

            $remainingAttempts = $response->data->remainingAttempts
                ?? $response->data->remainingAttempt
                ?? $response->data->remaining
                ?? null;

            return $this->respond([
                'status'              => 'success',
                'mode'                => 'otp',
                'response'            => 'Success',
                'reference_no'        => $reference,
                'mobile'              => $mobile,
                'message'             => 'Verification code sent successfully.',
                'remaining_attempts'  => $remainingAttempts,
            ]);
        }

        if (in_array($remoteStatus, ['OTPLimit', 'OTP_LIMIT_EXCEEDED', 'LimitExceeded', 'OtpLimitExceeded'], true)) {
            $message = $response->message ?? 'You have reached the OTP request limit. Please try again later.';
            return $this->fail($message, 429);
        }

        $message = $response->message ?? 'Unable to request OTP. Please try again.';
        return $this->fail($message);
    }

    public function verifyOtp()
    {
        $payload     = $this->request->getJSON(true) ?? $this->request->getPost();
        $mobile      = trim((string) ($payload['mobile'] ?? ''));
        $password    = trim((string) ($payload['password'] ?? ''));
        $referenceNo = trim((string) ($payload['reference_no'] ?? ''));
        $otp         = trim((string) ($payload['otp'] ?? ''));

        if ($mobile === '' || $password === '' || $referenceNo === '' || $otp === '') {
            return $this->failValidationErrors([
                'mobile'       => 'Mobile is required.',
                'password'     => 'Password is required.',
                'reference_no' => 'Reference number is required.',
                'otp'          => 'OTP code is required.',
            ]);
        }

        $response = $this->callApi([
            'funName'     => 'verifyOtp',
            'app_id'      => $this->appId,
            'referenceNo' => $referenceNo,
            'otp_code'    => $otp,
            'mobile'      => $mobile,
        ]);

        if (($response->response ?? null) !== 'Success') {
            return $this->fail('OTP verification failed.');
        }

        $userModel = model(UserModel::class);
        $user      = $userModel->where('mobile', $mobile)->first();

        if (! $user) {
            $userId = bin2hex(random_bytes(16));
            $userModel->insert([
                'id'           => $userId,
                'mobile'       => $mobile,
                'password'     => password_hash($password, PASSWORD_BCRYPT),
                'reg_datetime' => date('Y-m-d H:i:s'),
                'status'       => 'active',
            ]);
            $user = $userModel->find($userId);
        }

        session()->set([
            'isLoggedIn' => true,
            'user_id'    => $user['id'],
            'mobile'     => $user['mobile'],
            'provider'   => 'mobile',
        ]);

        session()->regenerate();

        return $this->respond([
            'status'  => 'success',
            'message' => 'OTP verified successfully!',
            'user'    => [
                'id'       => $user['id'],
                'mobile'   => $user['mobile'],
                'provider' => 'mobile',
            ],
        ]);
    }

    public function registerEmail()
    {
        $payload  = $this->request->getJSON(true) ?? $this->request->getPost();
        $email    = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = trim((string) ($payload['password'] ?? ''));

        if ($email === '' || $password === '') {
            return $this->failValidationErrors([
                'email'    => 'Email is required.',
                'password' => 'Password is required.',
            ]);
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->failValidationErrors([
                'email' => 'Invalid email format.',
            ]);
        }

        if (strlen($password) < 6) {
            return $this->failValidationErrors([
                'password' => 'Password must be at least 6 characters long.',
            ]);
        }

        $userModel = model(UserModel::class);
        $existing  = $userModel->where('email', $email)->first();

        if ($existing) {
            if (($existing['oauth_provider'] ?? null) === 'google') {
                return $this->fail(
                    'You previously signed in using Google. Please use "Continue with Google" to log in.',
                    409
                );
            }

            if (! password_verify($password, $existing['password'] ?? '')) {
                return $this->fail('Invalid password. Please try again.', 401);
            }

            session()->set([
                'isLoggedIn' => true,
                'user_id'    => $existing['id'],
                'email'      => $existing['email'],
            ]);

            return $this->respond([
                'status' => 'success',
                'mode'   => 'login',
                'user'   => [
                    'id'       => $existing['id'],
                    'email'    => $existing['email'],
                    'provider' => $existing['oauth_provider'] ?? 'password',
                ],
            ]);
        }

        $userId = bin2hex(random_bytes(16));

        $insertData = [
            'id'             => $userId,
            'email'          => $email,
            'mobile'         => null,
            'password'       => password_hash($password, PASSWORD_BCRYPT),
            'oauth_provider' => null,
            'oauth_id'       => null,
            'avatar'         => null,
            'reg_datetime'   => date('Y-m-d H:i:s'),
            'status'         => 'active',
        ];

        if (! $userModel->insert($insertData)) {
            log_message('error', 'Email registration failed via API: ' . json_encode($userModel->errors()));
            return $this->fail('Could not create account. Please try again later.', 500);
        }

        session()->set([
            'isLoggedIn' => true,
            'user_id'    => $userId,
            'email'      => $email,
        ]);

        session()->regenerate(true);

        return $this->respond([
            'status' => 'success',
            'mode'   => 'created',
            'user'   => [
                'id'       => $userId,
                'email'    => $email,
                'provider' => 'password',
            ],
        ]);
    }

    public function me()
    {
        $session = session();
        if (! $session->get('isLoggedIn')) {
            return $this->respond([
                'status' => 'guest',
                'user'   => null,
            ]);
        }

        $userId = $session->get('user_id');
        if (! $userId) {
            $session->destroy();
            return $this->respond([
                'status' => 'guest',
                'user'   => null,
            ]);
        }

        $userModel = model(UserModel::class);
        $user      = $userModel->find($userId);

        if (! $user) {
            $session->destroy();
            return $this->respond([
                'status' => 'guest',
                'user'   => null,
            ]);
        }

        return $this->respond([
            'status' => 'success',
            'user'   => [
                'id'       => $user['id'],
                'email'    => $user['email'],
                'mobile'   => $user['mobile'],
                'avatar'   => $user['avatar'],
                'provider' => $user['oauth_provider'] ?? null,
            ],
        ]);
    }

    public function logout()
    {
        $session = session();
        if (session_status() !== PHP_SESSION_ACTIVE) {
            $session->start();
        }

        $session->destroy();

        return $this->respond([
            'status'  => 'success',
            'message' => 'Logged out successfully.',
            'user'    => null,
        ]);
    }

    private function callApi(array $payload): object
    {
        $ch = curl_init($this->apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 15,
        ]);

        $body = curl_exec($ch);
        if ($body === false) {
            curl_close($ch);
            return (object) ['response' => null];
        }
        curl_close($ch);

        return json_decode($body) ?? (object) [];
    }
}
