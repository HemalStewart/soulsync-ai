<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\CoinManager;
use App\Libraries\CoinManagerException;
use CodeIgniter\API\ResponseTrait;
use Config\Database;
use Throwable;

class GeneratedVideos extends BaseController
{
    use ResponseTrait;

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

        $limit = (int) ($this->request->getGet('limit') ?? 12);
        $limit = max(1, min($limit, 50));

        $db = Database::connect();
        $rows = $db->table('generated_videos')
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
        $model = trim((string) ($payload['model'] ?? 'minimax/video-01'));
        $durationSeconds = isset($payload['duration_seconds'])
            ? (int) $payload['duration_seconds']
            : null;
        $thumbnailUrl = trim((string) ($payload['thumbnail_url'] ?? ''));

        if ($remoteUrl === '') {
            return $this->fail('remote_url is required.', 422);
        }

        if ($prompt === '') {
            return $this->fail('prompt is required.', 422);
        }

        $db = Database::connect();
        $builder = $db->table('generated_videos');

        $coinManager = service('coinManager');

        try {
            $updatedBalance = $coinManager->spend(
                (string) $userId,
                CoinManager::COST_GENERATE_VIDEO,
                'video_generation'
            );
        } catch (CoinManagerException $exception) {
            $status = str_contains($exception->getMessage(), 'table') ? 500 : 402;
            return $this->fail($exception->getMessage(), $status);
        }

        $data = [
            'user_id'          => $userId,
            'remote_url'       => $remoteUrl,
            'prompt'           => $prompt,
            'model'            => $model,
            'duration_seconds' => $durationSeconds,
            'thumbnail_url'    => $thumbnailUrl !== '' ? $thumbnailUrl : null,
            'created_at'       => date('Y-m-d H:i:s'),
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
                    CoinManager::COST_GENERATE_VIDEO,
                    'video_generation_failed'
                );
            } catch (CoinManagerException $refundException) {
                log_message(
                    'error',
                    'Failed to refund coins after video generation error: ' . $refundException->getMessage()
                );
            }

            $message = $throwable->getMessage();
            if (str_contains(strtolower($message), 'generated_videos')) {
                return $this->fail(
                    'Video storage table is missing. Please run the database migration for generated videos.',
                    500
                );
            }

            return $this->fail(
                'Failed to persist generated video. ' . $message,
                500
            );
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
        $builder = $db->table('generated_videos');
        $builder->where('id', $id)
            ->where('user_id', $userId)
            ->delete();

        if ($db->affectedRows() === 0) {
            return $this->failNotFound('Generated video not found.');
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'Video deleted.',
        ]);
    }

    public function clear()
    {
        $userId = session('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $db = Database::connect();
        $db->table('generated_videos')
            ->where('user_id', $userId)
            ->delete();

        return $this->respond([
            'status'  => 'success',
            'message' => 'All generated videos removed.',
        ]);
    }
}
