<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use Config\Database;
use Throwable;

class GeneratedImageReports extends BaseController
{
    use ResponseTrait;

    private const ALLOWED_REASONS = [
        'sexual_content',
        'violent_content',
        'hate_speech',
        'self_harm',
        'spam',
        'other',
    ];

    public function store(int $imageId)
    {
        $userId = session('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $payload = $this->request->getJSON(true) ?? $this->request->getPost();

        $reason = strtolower(trim((string) ($payload['reason'] ?? '')));
        $details = trim((string) ($payload['details'] ?? ''));

        if ($reason === '') {
            return $this->fail('reason is required.', 422);
        }

        if (! in_array($reason, self::ALLOWED_REASONS, true)) {
            return $this->fail('Invalid report reason selected.', 422);
        }

        $hasDetails = $details !== '';
        $details = $hasDetails ? $details : null;

        $db = Database::connect();

        $image = $db->table('generated_images')
            ->where('id', $imageId)
            ->get()
            ->getRowArray();

        if (! $image) {
            return $this->failNotFound('Generated image not found.');
        }

        if ((string) ($image['user_id'] ?? '') !== (string) $userId) {
            return $this->fail(
                'You can only report images generated from your account.',
                403
            );
        }

        $reportsTable = $db->table('generated_image_reports');

        $existing = $reportsTable
            ->where('generated_image_id', $imageId)
            ->where('reporter_user_id', $userId)
            ->get()
            ->getRowArray();

        if ($existing) {
            return $this->respond([
                'status'  => 'success',
                'message' => 'You already reported this image. We will follow up soon.',
            ]);
        }

        $data = [
            'generated_image_id'    => $imageId,
            'reporter_user_id'      => $userId,
            'reason'                => $reason,
            'details'               => $details,
            'snapshot_remote_url'   => $image['remote_url'] ?? null,
            'snapshot_prompt'       => $image['prompt'] ?? null,
            'snapshot_negative_prompt' => $image['negative_prompt'] ?? null,
            'created_at'            => date('Y-m-d H:i:s'),
        ];

        try {
            $reportsTable->insert($data);
        } catch (Throwable $throwable) {
            $message = strtolower($throwable->getMessage());
            if (str_contains($message, 'generated_image_reports')) {
                return $this->fail(
                    'Image report log is missing. Please run the generated image reports migration.',
                    500
                );
            }

            return $this->fail(
                'We could not submit your report. ' . $throwable->getMessage(),
                500
            );
        }

        return $this->respondCreated([
            'status'  => 'success',
            'message' => 'Thanks for reporting this image. Our team will review it shortly.',
        ]);
    }
}
