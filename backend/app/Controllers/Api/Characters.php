<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use Config\Database;

class Characters extends BaseController
{
    public function index()
    {
        $db = Database::connect();

        $includeUserCharacters = $this->request->getGet('include_user');
        $includeUser = false;

        if (is_string($includeUserCharacters)) {
            $includeUser = filter_var($includeUserCharacters, FILTER_VALIDATE_BOOLEAN);
        } elseif (is_bool($includeUserCharacters)) {
            $includeUser = $includeUserCharacters;
        }

        $userId = $includeUser ? ($this->request->getGet('user_id') ?? session('user_id')) : null;
        $hasUserTable = $db->tableExists('user_characters');

        $globalRows = $db->table('ai_characters')
            ->select('id, name, slug, avatar, title, personality, expertise, tone, tags, video_url, intro_line, created_at, is_active')
            ->where('is_active', 1)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        $data = array_map([$this, 'mapGlobalCharacter'], $globalRows);

        if ($includeUser && $userId && $hasUserTable) {
            $userRows = $db->table('user_characters')
                ->select('id, name, slug, avatar, title, personality, expertise, tone, traits, created_at, is_active, greeting')
                ->where('user_id', $userId)
                ->where('is_active', 1)
                ->orderBy('created_at', 'DESC')
                ->get()
                ->getResultArray();

            if (! empty($userRows)) {
                $data = array_merge(
                    array_map([$this, 'mapUserCharacter'], $userRows),
                    $data
                );
            }
        }

        return $this->response->setJSON([
            'status' => 'success',
            'count'  => count($data),
            'data'   => $data,
        ]);
    }

    /**
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function mapGlobalCharacter(array $row): array
    {
        $introLine = $row['intro_line'] ?? null;

        return [
            'id'         => (string) $row['id'],
            'name'       => $row['name'],
            'slug'       => $row['slug'],
            'avatar'     => $row['avatar'] ?? null,
            'title'      => $row['title'] ?? null,
            'personality'=> $row['personality'] ?? null,
            'expertise'  => $row['expertise'] ?? null,
            'tone'       => $row['tone'] ?? null,
            'tags'       => $row['tags'] ?? null,
            'video_url'  => $row['video_url'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'is_active'  => $row['is_active'] ?? 1,
            'source'     => 'global',
            'intro_line' => $introLine,
            'greeting'   => $row['greeting'] ?? $introLine,
        ];
    }

    /**
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function mapUserCharacter(array $row): array
    {
        $traits = [];
        if (! empty($row['traits'])) {
            $decoded = json_decode((string) $row['traits'], true);
            if (is_array($decoded)) {
                $traits = array_values(array_filter(array_map(
                    static fn ($value) => is_string($value) ? trim($value) : '',
                    $decoded
                )));
            }
        }

        $tags = $traits ? implode(', ', $traits) : null;

        return [
            'id'          => 'user-' . $row['id'],
            'name'        => $row['name'],
            'slug'        => $row['slug'],
            'avatar'      => $row['avatar'] ?? null,
            'title'       => $row['title'] ?? null,
            'personality' => $row['personality'] ?? null,
            'expertise'   => $row['expertise'] ?? null,
            'tone'        => $row['tone'] ?? null,
            'tags'        => $tags,
            'video_url'   => null,
            'created_at'  => $row['created_at'] ?? null,
            'is_active'   => $row['is_active'] ?? 1,
            'source'      => 'user',
            'greeting'    => $row['greeting'] ?? null,
            'intro_line'  => $row['greeting'] ?? null,
        ];
    }
}
