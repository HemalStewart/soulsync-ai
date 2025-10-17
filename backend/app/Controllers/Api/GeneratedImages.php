<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use Config\Database;

class GeneratedImages extends BaseController
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

        $db = Database::connect();
        $builder = $db->table('generated_images');

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

        $builder->insert($data);
        $insertId = $db->insertID();

        $record = $builder
            ->where('id', $insertId)
            ->get()
            ->getRowArray();

        return $this->respondCreated([
            'status' => 'success',
            'data'   => $record,
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
}
