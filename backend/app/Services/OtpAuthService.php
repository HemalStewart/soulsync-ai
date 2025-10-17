<?php

namespace App\Services;

use App\Core\Database;
use App\Exceptions\SomethingWentWrongException;
use App\Exceptions\ValidationException;
use function App\Helpers\ValidateDTO;
use PDO;

require_once dirname(__DIR__) . '/Helpers/ValidationHelper.php';

class OtpAuthService
{
    public function __construct(
        private readonly ?string $apiUrl = null,
        private readonly ?string $appId = null,
    ) {
    }

    /**
     * Request an OTP from the remote gateway.
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function requestOTP(array $payload): array
    {
        $this->logDebug('requestOTP payload: ' . $this->encode($payload));

        $data = ValidateDTO($payload, [
            'mobile' => ['required', 'string', 'regex:/^07([0-2]|[4-8])\d{7}$/'],
            'invite_code' => ['nullable', 'string', 'max:10'],
        ]);

        $mobile = $data['mobile'];
        $response = $this->callGateway('requestOTP', ['mobile' => $mobile]);

        $referenceNo = $response->referenceNo ?? $response->reference ?? null;

        if (! empty($response->response) && in_array($response->response, ['Exist', 'Success'], true)) {
            $user = $this->ensureUserRecord($mobile, $data['invite_code'] ?? null);
        } else {
            $user = $this->fetchUserByMobile($mobile);
        }

        return [
            'status' => $response->response ?? 'Unknown',
            'reference_no' => $referenceNo,
            'user' => $user['id'] ?? null,
            'raw_response' => $response,
        ];
    }

    /**
     * Verify the OTP with the remote gateway.
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function verifyOtp(array $payload): array
    {
        $this->logDebug('verifyOtp payload: ' . $this->encode($payload));

        $data = ValidateDTO($payload, [
            'mobile' => ['required', 'string', 'regex:/^07([0-2]|[4-8])\d{7}$/'],
            'otp_code' => ['required', 'string', 'min:4', 'max:10'],
            'reference_no' => ['required', 'string'],
        ]);

        $response = $this->callGateway('verifyOtp', [
            'mobile' => $data['mobile'],
            'otp_code' => $data['otp_code'],
            'referenceNo' => $data['reference_no'],
        ]);

        if (($response->response ?? null) !== 'Success') {
            $message = $response->message ?? 'OTP verification failed.';
            throw new ValidationException($message);
        }

        $user = $this->ensureUserRecord($data['mobile']);

        return [
            'status' => 'verified',
            'mobile' => $data['mobile'],
            'reference_no' => $data['reference_no'],
            'user' => $user['id'],
            'raw_response' => $response,
        ];
    }

    /**
     * Check the OTP/registration status via the remote gateway.
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function checkStatus(array $payload): array
    {
        $data = ValidateDTO($payload, [
            'mobile' => ['required', 'string', 'regex:/^07([0-2]|[4-8])\d{7}$/'],
        ]);

        $response = $this->callGateway('checkStatus', [
            'mobile' => $data['mobile'],
        ]);

        $user = $this->fetchUserByMobile($data['mobile']);

        return [
            'status' => $response->response ?? 'Unknown',
            'raw_response' => $response,
            'user' => $user,
        ];
    }

    /**
     * Deregister the user via the remote gateway.
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function unRegistration(array $payload): array
    {
        $data = ValidateDTO($payload, [
            'mobile' => ['required', 'string', 'regex:/^07([0-2]|[4-8])\d{7}$/'],
        ]);

        $mobile = $data['mobile'];

        if ($mobile !== 'info.sachisoft@gmail.com') {
            $response = $this->callGateway('unRegistration', ['mobile' => $mobile]);
        } else {
            $response = (object) ['response' => 'Success', 'message' => null];
        }

        $this->deactivateUser($mobile);

        return [
            'status' => $response->response ?? 'Success',
            'raw_response' => $response,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function ensureUserRecord(string $mobile, ?string $inviteCode = null): array
    {
        $existing = $this->fetchUserByMobile($mobile);

        if ($existing) {
            if ($inviteCode) {
                $update = Database::prepare('UPDATE user SET invite_code = :invite_code WHERE id = :id');
                Database::handlePrepareQuery($update, [
                    'invite_code' => $inviteCode,
                    'id' => $existing['id'],
                ]);
                $existing['invite_code'] = $inviteCode;
            }

            return $existing;
        }

        $userId = $this->generateUuid();
        $invite = $inviteCode ?: $this->generateInviteCode();

        $insert = Database::prepare(
            'INSERT INTO user (id, mobile, invite_code, status, reg_datetime) VALUES (:id, :mobile, :invite_code, :status, NOW())'
        );

        Database::handlePrepareQuery($insert, [
            'id' => $userId,
            'mobile' => $mobile,
            'invite_code' => $invite,
            'status' => 'active',
        ]);

        return [
            'id' => $userId,
            'mobile' => $mobile,
            'invite_code' => $invite,
            'status' => 'active',
            'reg_datetime' => date('Y-m-d H:i:s'),
        ];
    }

    private function deactivateUser(string $mobile): void
    {
        $statement = Database::prepare('UPDATE user SET status = :status WHERE mobile = :mobile');
        Database::handlePrepareQuery($statement, [
            'status' => 'inactive',
            'mobile' => $mobile,
        ]);
    }

    private function fetchUserByMobile(string $mobile): ?array
    {
        $statement = Database::prepare(
            'SELECT id, mobile, invite_code, reg_datetime, status FROM user WHERE mobile = :mobile LIMIT 1'
        );

        $result = Database::handlePrepareQuery($statement, [
            'mobile' => $mobile,
        ])->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function callGateway(string $function, array $payload): object
    {
        $endpoint = $this->apiUrl ?? env('otp.apiUrl') ?: getenv('OTP_API_URL');
        $appId = $this->appId ?? env('otp.appId') ?: getenv('OTP_APP_ID');

        if (! $endpoint || ! $appId) {
            throw new SomethingWentWrongException('OTP gateway credentials are not configured.');
        }

        $postData = [
            'funName' => $function,
            'app_id' => $appId,
        ] + $payload;

        $this->logDebug('Calling remote OTP gateway: ' . $function);

        $ch = curl_init($endpoint);

        if ($ch === false) {
            throw new SomethingWentWrongException('Unable to initialize cURL session.');
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($postData),
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new SomethingWentWrongException('Failed to communicate with OTP gateway: ' . $error);
        }

        $decoded = json_decode($response);

        if (! $decoded) {
            throw new SomethingWentWrongException('Unexpected response from OTP gateway.');
        }

        return $decoded;
    }

    private function generateUuid(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function generateInviteCode(): string
    {
        return strtoupper(substr(bin2hex(random_bytes(10)), 0, 8));
    }

    private function encode(mixed $value): string
    {
        try {
            return json_encode($value, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return '[unserializable]';
        }
    }

    private function logDebug(string $message): void
    {
        log_message('debug', '[OtpAuthService] ' . $message);
    }
}

