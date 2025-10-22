<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\CoinManager;
use App\Libraries\CoinManagerException;
use CodeIgniter\API\ResponseTrait;
use Config\Database;
use Throwable;

class UserCharacters extends BaseController
{
    use ResponseTrait;

    public function index()
    {
        $userId = session('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $db = Database::connect();
        if (! $db->tableExists('user_characters')) {
            return $this->fail(
                'Character creation is not available yet. Please run the latest migrations.',
                503
            );
        }

        $rows = $db->table('user_characters')
            ->where('user_id', $userId)
            ->where('is_active', 1)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        $mapped = array_map([$this, 'formatRow'], $rows);

        return $this->respond([
            'status' => 'success',
            'count'  => count($mapped),
            'data'   => $mapped,
        ]);
    }

    public function store()
    {
        $userId = session('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $payload = $this->request->getJSON(true) ?? $this->request->getPost();

        $name = $this->sanitizeString($payload['name'] ?? '');
        $title = $this->sanitizeString($payload['title'] ?? '');
        $personality = $this->sanitizeString($payload['personality'] ?? '');
        $backstory = $this->sanitizeString($payload['backstory'] ?? '', allowMultiline: true);
        $expertise = $this->sanitizeString($payload['expertise'] ?? '', allowMultiline: true);
        $greeting = $this->sanitizeString($payload['greeting'] ?? '', allowMultiline: true);
        $tone = $this->sanitizeString($payload['tone'] ?? '');
        $voice = $this->sanitizeString($payload['voice'] ?? '');
        $memoryMode = $this->sanitizeString($payload['memory_mode'] ?? 'user');
        $visibility = $this->sanitizeString($payload['visibility'] ?? 'private');
        $avatar = trim((string) ($payload['avatar'] ?? ''));
        $traits = $this->normaliseStringList($payload['traits'] ?? []);

        $errors = [];
        if ($name === '') {
            $errors['name'] = 'Name is required.';
        }

        if ($title === '') {
            $errors['title'] = 'Title is required.';
        }

        if ($personality === '') {
            $errors['personality'] = 'Personality summary is required.';
        }

        if (! empty($avatar) && strlen($avatar) > (2 * 1024 * 1024)) {
            $errors['avatar'] = 'Avatar payload is too large.';
        }

        $age = null;
        $rawAge = $payload['age'] ?? null;
        if ($rawAge !== null && $rawAge !== '') {
            if (is_numeric($rawAge) && (int) $rawAge > 0) {
                $age = (int) $rawAge;
            } else {
                $errors['age'] = 'Age must be a positive whole number.';
            }
        }

        if (! empty($errors)) {
            return $this->failValidationErrors($errors);
        }

        $memoryMode = in_array($memoryMode, ['user', 'global', 'none'], true)
            ? $memoryMode
            : 'user';

        $visibility = in_array($visibility, ['private', 'public'], true)
            ? $visibility
            : 'private';

        $slug = $this->generateUniqueSlug($name);

        $db = Database::connect();
        if (! $db->tableExists('user_characters')) {
            return $this->fail(
                'Character creation is not available yet. Please run the latest migrations.',
                503
            );
        }

        $builder = $db->table('user_characters');

        $coinManager = service('coinManager');

        try {
            $updatedBalance = $coinManager->spend(
                (string) $userId,
                CoinManager::COST_CREATE_CHARACTER,
                'character_creation'
            );
        } catch (CoinManagerException $exception) {
            $status = str_contains($exception->getMessage(), 'table') ? 500 : 402;
            return $this->fail($exception->getMessage(), $status);
        }

        $now = date('Y-m-d H:i:s');

        $data = [
            'user_id'     => $userId,
            'name'        => $name,
            'slug'        => $slug,
            'avatar'      => $avatar !== '' ? $avatar : null,
            'title'       => $title,
            'personality' => $personality,
            'backstory'   => $backstory !== '' ? $backstory : null,
            'expertise'   => $expertise !== '' ? $expertise : null,
            'traits'      => ! empty($traits) ? json_encode($traits, JSON_UNESCAPED_UNICODE) : null,
            'greeting'    => $greeting !== '' ? $greeting : null,
            'voice'       => $voice !== '' ? $voice : null,
            'tone'        => $tone !== '' ? $tone : null,
            'memory_mode' => $memoryMode,
            'visibility'  => $visibility,
            'is_active'   => 1,
            'created_at'  => $now,
            'updated_at'  => $now,
        ];

        if ($db->fieldExists('age', 'user_characters')) {
            $data['age'] = $age;
        }

        try {
            $builder->insert($data);
            $insertId = (int) $db->insertID();
        } catch (Throwable $throwable) {
            try {
                $coinManager->refund(
                    (string) $userId,
                    CoinManager::COST_CREATE_CHARACTER,
                    'character_creation_failed'
                );
            } catch (CoinManagerException $refundException) {
                log_message(
                    'error',
                    'Failed to refund coins after character creation error: ' . $refundException->getMessage()
                );
            }

            return $this->fail('Unable to create character at this time.', 500);
        }

        $record = $builder
            ->where('id', $insertId)
            ->get()
            ->getRowArray();

        if (! $record) {
            try {
                $coinManager->refund(
                    (string) $userId,
                    CoinManager::COST_CREATE_CHARACTER,
                    'character_creation_missing_record'
                );
            } catch (CoinManagerException $refundException) {
                log_message(
                    'error',
                    'Failed to refund coins after missing character record: ' . $refundException->getMessage()
                );
            }

            return $this->fail('Unable to create character at this time.', 500);
        }

        return $this->respondCreated([
            'status' => 'success',
            'data'   => $this->formatRow($record),
            'coin_balance' => $updatedBalance,
        ]);
    }

    private function sanitizeString($value, bool $allowMultiline = false): string
    {
        if (! is_string($value)) {
            return '';
        }

        $value = trim($value);

        if (! $allowMultiline) {
            $value = preg_replace('/\s+/', ' ', $value) ?? '';
        }

        return $value;
    }

    /**
     * @param mixed $value
     * @return list<string>
     */
    private function normaliseStringList($value): array
    {
        if (is_string($value)) {
            $value = preg_split('/[,\n|]+/', $value) ?: [];
        }

        if (! is_array($value)) {
            return [];
        }

        $items = [];
        foreach ($value as $entry) {
            if (! is_string($entry)) {
                continue;
            }
            $item = trim($entry);
            if ($item !== '' && ! in_array($item, $items, true)) {
                $items[] = $item;
            }
        }

        return $items;
    }

    private function formatRow(array $row): array
    {
        $traits = [];
        if (! empty($row['traits'])) {
            $decoded = json_decode((string) $row['traits'], true);
            if (is_array($decoded)) {
                $traits = array_values(array_filter(array_map(
                    static fn ($entry) => is_string($entry) ? trim($entry) : '',
                    $decoded
                )));
            }
        }

        return [
            'id'          => (int) $row['id'],
            'user_id'     => $row['user_id'],
            'name'        => $row['name'],
            'slug'        => $row['slug'],
            'avatar'      => $row['avatar'] ?? null,
            'title'       => $row['title'] ?? null,
            'personality' => $row['personality'] ?? null,
            'backstory'   => $row['backstory'] ?? null,
            'expertise'   => $row['expertise'] ?? null,
            'traits'      => $traits,
            'greeting'    => $row['greeting'] ?? null,
            'voice'       => $row['voice'] ?? null,
            'tone'        => $row['tone'] ?? null,
            'memory_mode' => $row['memory_mode'] ?? 'user',
            'visibility'  => $row['visibility'] ?? 'private',
            'created_at'  => $row['created_at'],
            'updated_at'  => $row['updated_at'] ?? null,
            'source'      => 'user',
            'age'         => array_key_exists('age', $row) && $row['age'] !== null
                ? (int) $row['age']
                : null,
            'role'        => isset($row['role']) && trim((string) $row['role']) !== ''
                ? trim((string) $row['role'])
                : null,
        ];
    }

    public function update($id = null)
    {
        $db = \Config\Database::connect();
        $userId = session('user_id');

        if (! $userId) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'You must be logged in.',
            ])->setStatusCode(401);
        }

        if (! $id) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Character ID is missing.',
            ])->setStatusCode(400);
        }

        $input = $this->request->getJSON(true);

        $builder = $db->table('user_characters');
        $character = $builder->where('id', $id)->where('user_id', $userId)->get()->getRowArray();

        if (! $character) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Character not found.',
            ])->setStatusCode(404);
        }

        $errors = [];
        $rawAge = $input['age'] ?? null;
        $age = null;
        if (array_key_exists('age', $input)) {
            if ($rawAge === null || $rawAge === '') {
                $age = null;
            } elseif (is_numeric($rawAge) && (int) $rawAge > 0) {
                $age = (int) $rawAge;
            } else {
                $errors['age'] = 'Age must be a positive whole number.';
            }
        } elseif (array_key_exists('age', $character) && $character['age'] !== null) {
            $age = (int) $character['age'];
        }

        if (! empty($errors)) {
            return $this->failValidationErrors($errors);
        }

        $data = [
            'name'        => $input['name'] ?? $character['name'],
            'title'       => $input['title'] ?? $character['title'],
            'avatar'      => $input['avatar'] ?? $character['avatar'],
            'personality' => $input['personality'] ?? $character['personality'],
            'backstory'   => $input['backstory'] ?? $character['backstory'],
            'expertise'   => $input['expertise'] ?? $character['expertise'],
            'traits'      => json_encode($input['traits'] ?? json_decode($character['traits'], true)),
            'tone'        => $input['tone'] ?? $character['tone'],
            'voice'       => $input['voice'] ?? $character['voice'],
            'greeting'    => $input['greeting'] ?? $character['greeting'],
            'updated_at'  => date('Y-m-d H:i:s'),
        ];

        if ($db->fieldExists('age', 'user_characters')) {
            $data['age'] = $age;
        }

        $builder->where('id', $id)->update($data);

        $updatedRecord = array_merge($character, $data);

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Character updated successfully',
            'data' => $this->formatRow($updatedRecord),
        ]);
    }


    private function generateUniqueSlug(string $name): string
    {
        helper('text');

        $base = strtolower(url_title($name, '-', true));
        if ($base === '') {
            $base = 'character';
        }

        $db = Database::connect();
        $slug = $base;
        $counter = 2;

        while ($this->slugExists($db, $slug)) {
            $slug = $base . '-' . $counter;
            $counter++;

            if ($counter > 20) {
                $slug = $base . '-' . bin2hex(random_bytes(2));
                if (! $this->slugExists($db, $slug)) {
                    break;
                }
            }
        }

        return $slug;
    }

    private function slugExists($db, string $slug): bool
    {
        $aiCount = $db->table('ai_characters')
            ->where('slug', $slug)
            ->countAllResults();

        if ($aiCount > 0) {
            return true;
        }

        $userCount = $db->table('user_characters')
            ->where('slug', $slug)
            ->countAllResults();

        return $userCount > 0;
    }
}
