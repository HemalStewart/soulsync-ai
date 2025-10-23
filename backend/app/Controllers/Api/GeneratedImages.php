<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\CoinManager;
use App\Libraries\CoinManagerException;
use CodeIgniter\API\ResponseTrait;
use Config\Database;
use Throwable;

/**
 * Persists generated image metadata for the currently authenticated user.
 *
 * Incoming `remote_url` values can be either fully qualified HTTP URLs
 * (e.g. Venice hosted assets) or base64 data URLs returned by Venice
 * when `return_binary` is false. We convert those base64 payloads into
 * files under `public/uploads/generated` so the frontend always receives
 * a lightweight HTTP URL instead of a multi-megabyte string.
 */
class GeneratedImages extends BaseController
{
    use ResponseTrait;

    private const GENERATED_UPLOAD_DIR = 'uploads/generated';

    private function resolveUserId(): ?string
    {
        $request = $this->request;
        $userId = $request->getGet('user_id')
            ?? $request->getPost('user_id')
            ?? session('user_id');

        if (! $userId) {
            return null;
        }

        return trim((string) $userId);
    }

    public function index()
    {
        $userId = $this->resolveUserId();

        if (! $userId) {
            return $this->fail('user_id is required.', 400);
        }

        $limit = (int) ($this->request->getGet('limit') ?? 24);
        $limit = max(1, min($limit, 100));

        $db = Database::connect();
        $rows = $db->table('generated_images')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => 'success',
            'count'  => count($rows),
            'data'   => $rows,
        ]);
    }

    public function store()
    {
        $userId = session('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $payload = $this->request->getJSON(true) ?? $this->request->getPost();

        $remoteUrl = trim((string) ($payload['remote_url'] ?? ''));
        $prompt = trim((string) ($payload['prompt'] ?? ''));
        $negativePrompt = trim((string) ($payload['negative_prompt'] ?? ''));
        $style = trim((string) ($payload['style'] ?? ''));
        $aspectRatio = trim((string) ($payload['aspect_ratio'] ?? ''));
        $quality = (int) ($payload['quality'] ?? 3);
        if ($quality < 1) {
            $quality = 1;
        } elseif ($quality > 5) {
            $quality = 5;
        }
        $apiType = trim((string) ($payload['api_type'] ?? 'view'));

        if ($remoteUrl === '') {
            return $this->fail('remote_url is required.', 422);
        }

        if ($prompt === '') {
            return $this->fail('prompt is required.', 422);
        }

        if ($style === '') {
            return $this->fail('style is required.', 422);
        }

        if ($aspectRatio === '') {
            return $this->fail('aspect_ratio is required.', 422);
        }

        $remoteUrl = $this->resolveRemoteUrl($remoteUrl, (string) $userId);

        $db = Database::connect();
        $builder = $db->table('generated_images');

        $coinManager = service('coinManager');

        try {
            $updatedBalance = $coinManager->spend(
                (string) $userId,
                CoinManager::COST_GENERATE_IMAGE,
                'image_generation'
            );
        } catch (CoinManagerException $exception) {
            $status = str_contains($exception->getMessage(), 'table') ? 500 : 402;
            return $this->fail($exception->getMessage(), $status);
        }

        $data = [
            'user_id'        => $userId,
            'remote_url'     => $remoteUrl,
            'prompt'         => $prompt,
            'negative_prompt'=> $negativePrompt !== '' ? $negativePrompt : null,
            'style'          => $style,
            'aspect_ratio'   => $aspectRatio,
            'quality'        => $quality,
            'api_type'       => $apiType,
            'created_at'     => date('Y-m-d H:i:s'),
        ];

        try {
            $builder->insert($data);
            $insertId = $db->insertID();

            $record = $builder
                ->where('id', $insertId)
                ->get()
                ->getRowArray();
        } catch (Throwable $throwable) {
            try {
                $coinManager->refund(
                    (string) $userId,
                    CoinManager::COST_GENERATE_IMAGE,
                    'image_generation_failed'
                );
            } catch (CoinManagerException $refundException) {
                log_message(
                    'error',
                    'Failed to refund coins after image generation error: ' . $refundException->getMessage()
                );
            }

            throw $throwable;
        }

        return $this->respondCreated([
            'status'       => 'success',
            'data'         => $record,
            'coin_balance' => $updatedBalance,
        ]);
    }

    public function destroy(int $id)
    {
        $userId = session('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $db = Database::connect();
        $builder = $db->table('generated_images');
        $builder->where('id', $id)
            ->where('user_id', $userId)
            ->delete();

        if ($db->affectedRows() === 0) {
            return $this->failNotFound('Generated image not found.');
        }

        return $this->respond([
            'status' => 'success',
            'message'=> 'Image deleted.',
        ]);
    }

    public function clear()
    {
        $userId = session('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $db = Database::connect();
        $db->table('generated_images')
            ->where('user_id', $userId)
            ->delete();

        return $this->respond([
            'status' => 'success',
            'message'=> 'All generated images removed.',
        ]);
    }

    /**
     * Converts data URLs to public files so the database keeps small URLs.
     * HTTP URLs are left untouched.
     */
    private function resolveRemoteUrl(string $value, string $userId): string
    {
        if ($value === '' || strpos($value, 'data:image/') !== 0) {
            return $value;
        }

        if (! preg_match('#^data:image/([a-z0-9+.-]+);base64,(.+)$#i', $value, $matches)) {
            return $value;
        }

        $extension = strtolower($matches[1]);
        $extension = $extension === 'jpeg' ? 'jpg' : $extension;
        $encoded = str_replace(' ', '+', $matches[2]);
        $binary = base64_decode($encoded, true);

        if ($binary === false) {
            return $value;
        }

        $publicDir = FCPATH . self::GENERATED_UPLOAD_DIR;
        if (! is_dir($publicDir) && ! mkdir($publicDir, 0755, true) && ! is_dir($publicDir)) {
            return $value;
        }

        $filename = sprintf(
            '%s_%s.%s',
            $userId,
            bin2hex(random_bytes(8)),
            $extension ?: 'webp'
        );

        $filepath = $publicDir . DIRECTORY_SEPARATOR . $filename;
        if (file_put_contents($filepath, $binary) === false) {
            return $value;
        }

        helper('url');
        return base_url(self::GENERATED_UPLOAD_DIR . '/' . $filename);
    }
}
