<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use Config\Database;

class Chats extends BaseController
{
    use ResponseTrait;

    public function index()
    {
        $request = $this->request;
        $userId = $request->getGet('user_id') ?? session('user_id');

        if (! $userId) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'user_id is required.',
            ]);
        }

        $characterSlug = $request->getGet('character_slug');
        $limit = max(1, min((int) ($request->getGet('limit') ?? 20), 100));

        $db = Database::connect();

        $subQuery = $db->table('ai_messages')
            ->select('MAX(id) AS id')
            ->where('user_id', $userId);

        if ($characterSlug) {
            $subQuery->where('character_slug', $characterSlug);
        }

        $subQuery->groupBy('character_slug');

        $compiledSubQuery = $subQuery->getCompiledSelect(false);

        $builder = $db->table('ai_messages m')
            ->select('m.id, m.character_slug, m.user_id, m.sender, m.message, m.created_at, m.session_id, c.name AS character_name, c.avatar AS character_avatar, c.title AS character_title')
            ->join("({$compiledSubQuery}) latest", 'latest.id = m.id', 'inner')
            ->join('ai_characters c', 'c.slug = m.character_slug', 'left')
            ->orderBy('m.created_at', 'DESC')
            ->limit($limit);

        if ($characterSlug) {
            $builder->where('m.character_slug', $characterSlug);
        }

        $rows = $builder->get()->getResultArray();

        return $this->response->setJSON([
            'status' => 'success',
            'count'  => count($rows),
            'data'   => $rows,
        ]);
    }

    public function show(string $slug)
    {
        $userId = $this->request->getGet('user_id') ?? session('user_id');

        if (! $userId) {
            return $this->fail('user_id is required.', 400);
        }

        $db = Database::connect();

        $character = $db->table('ai_characters')
            ->where('slug', $slug)
            ->get()
            ->getRowArray();

        if (! $character) {
            return $this->failNotFound('Character not found.');
        }

        $messages = $db->table('ai_messages')
            ->select('id, sender, message, created_at')
            ->where('character_slug', $slug)
            ->where('user_id', $userId)
            ->orderBy('created_at', 'ASC')
            ->limit(200)
            ->get()
            ->getResultArray();

        $characterData = [
            'slug'      => $character['slug'],
            'name'      => $character['name'],
            'avatar'    => $character['avatar'],
            'title'     => $character['title'],
            'video_url' => $character['video_url'] ?? null,
        ];

        if (empty($messages)) {
            $introLine = $character['intro_line']
                ?? "Hey there! I'm {$character['name']}, {$character['title']}. How are you today?";

            $messages[] = [
                'sender'     => 'ai',
                'message'    => $introLine,
                'created_at' => date('Y-m-d H:i:s'),
            ];
        }

        return $this->respond([
            'status'    => 'success',
            'character' => $characterData,
            'messages'  => $messages,
        ]);
    }

    public function send(string $slug)
    {
        $db = Database::connect();
        $character = $db->table('ai_characters')
            ->where('slug', $slug)
            ->get()
            ->getRowArray();

        if (! $character) {
            return $this->failNotFound('Character not found.');
        }

        $payload = $this->request->getJSON(true) ?? $this->request->getPost();
        $message = trim((string) ($payload['message'] ?? ''));

        if ($message === '') {
            return $this->fail('Message cannot be empty.', 422);
        }

        $userId = session()->get('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $rapidApiKey = env('rapidapi.aiGirlfriendKey');
        if (! $rapidApiKey) {
            return $this->fail('Missing RapidAPI key.', 500);
        }
        log_message('debug', 'RapidAPI key prefix in use: ' . substr($rapidApiKey, 0, 6) . '***');

        $sessionId = session_id();

        $history = $db->table('ai_messages')
            ->where('character_slug', $slug)
            ->where('user_id', $userId)
            ->orderBy('id', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $chatHistory = $this->buildChatHistoryPayload($history);
        $profilePayload = $this->buildProfilePayload($character);

        $requestPayload = [
            'message'     => $message,
            'profile'     => $profilePayload,
            'chatHistory' => $chatHistory,
        ];

        $rapidHost = 'ai-girlfriend-generator-virtual-girlfriend-sexy-chat.p.rapidapi.com';
        $endpoint = sprintf('https://%s/chat?noqueue=1&language=en', $rapidHost);

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'X-RapidAPI-Key: ' . $rapidApiKey,
                'X-RapidAPI-Host: ' . $rapidHost,
            ],
            CURLOPT_POSTFIELDS     => json_encode($requestPayload),
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $error    = curl_error($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            log_message('error', 'RapidAPI AI Girlfriend call failed: ' . $error);
            return $this->fail('Network error. Please try again.');
        }

        $decoded = json_decode($response, true);

        if (! isset($decoded['result']['response'])) {
            $apiMessage = $decoded['message'] ?? 'Unexpected response from AI service.';
            log_message('error', 'RapidAPI AI Girlfriend response missing content: ' . json_encode($decoded) . ' (status ' . $statusCode . ')');
            return $this->fail($apiMessage);
        }

        $reply = trim((string) $decoded['result']['response']);
        if ($reply === '') {
            $reply = 'No reply from AI.';
        }

        $db->table('ai_messages')->insert([
            'character_slug' => $slug,
            'user_id'        => $userId,
            'sender'         => 'user',
            'message'        => $message,
            'session_id'     => $sessionId,
        ]);

        $db->table('ai_messages')->insert([
            'character_slug' => $slug,
            'user_id'        => $userId,
            'sender'         => 'ai',
            'message'        => $reply,
            'session_id'     => $sessionId,
        ]);

        return $this->respond([
            'status'      => 'success',
            'userMessage' => [
                'sender'     => 'user',
                'message'    => $message,
                'created_at' => date('Y-m-d H:i:s'),
            ],
            'aiMessage'   => [
                'sender'     => 'ai',
                'message'    => $reply,
                'created_at' => date('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Formats stored chat history to the structure expected by the RapidAPI endpoint.
     *
     * @param list<array<string,mixed>> $history
     */
    private function buildChatHistoryPayload(array $history): array
    {
        $payload = [];

        foreach (array_reverse($history) as $entry) {
            $payload[] = [
                'role'    => ($entry['sender'] ?? '') === 'user' ? 'user' : 'assistant',
                'content' => $entry['message'] ?? '',
            ];
        }

        return $payload;
    }

    /**
     * Creates a persona profile payload based on stored character metadata.
     *
     * @param array<string,mixed> $character
     */
    private function buildProfilePayload(array $character): array
    {
        $name = $character['name'] ?? 'SoulFun Companion';
        $title = $character['title'] ?? 'Virtual Companion';
        $personalitySummary = $character['personality'] ?? 'A warm and engaging presence.';
        $communicationStyle = $character['tone'] ?? 'Playful';

        $interests = $this->parseList($character['tags'] ?? null);
        $traits = $this->parseList($character['personality'] ?? null);
        $activities = $this->parseList($character['expertise'] ?? null);

        if (empty($traits)) {
            $traits = [$communicationStyle];
        }

        if (empty($interests)) {
            $interests = ['Conversation', 'Daily life', 'Personal stories'];
        }

        if (empty($activities)) {
            $activities = ['Text chat', 'Storytelling'];
        }

        return [
            'profile' => [
                'name'                => $name,
                'age'                 => (int) ($character['age'] ?? 25),
                'personality'         => $personalitySummary,
                'interests'           => $interests,
                'background'          => $title,
                'traits'              => $traits,
                'communicationStyle'  => $communicationStyle,
            ],
            'appearance' => [
                'height'               => $character['appearance_height'] ?? 'Average height',
                'physicalDescription'  => $character['appearance_description']
                    ?? ($character['bio'] ?? 'Stylish and confident companion.'),
                'style'                => $character['appearance_style'] ?? 'Casual chic',
            ],
            'interactionPreferences' => [
                'conversationTopics'     => $interests,
                'activities'             => $activities,
                'communicationFrequency' => 'Frequent',
                'boundariesAndLimits'    => [],
            ],
        ];
    }

    /**
     * Normalises string or JSON encoded lists into an array of strings.
     *
     * @param mixed $value
     * @return list<string>
     */
    private function parseList($value): array
    {
        if ($value === null) {
            return [];
        }

        if (is_array($value)) {
            return array_values(array_filter(array_map('trim', $value)));
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return array_values(array_filter(array_map('trim', $decoded)));
            }

            $parts = preg_split('/[,\n|]+/', $value) ?: [];
            return array_values(array_filter(array_map('trim', $parts)));
        }

        return [];
    }
}
