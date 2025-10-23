<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\CoinManager;
use App\Libraries\CoinManagerException;
use CodeIgniter\API\ResponseTrait;
use Config\Database;

class Chats extends BaseController
{
    use ResponseTrait;

    private const MEDIA_MESSAGE_PREFIX = '__media__:';

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
        $hasUserTable = $db->tableExists('user_characters');

        $subQuery = $db->table('ai_messages')
            ->select('MAX(id) AS id')
            ->where('user_id', $userId);

        if ($characterSlug) {
            $subQuery->where('character_slug', $characterSlug);
        }

        $subQuery->groupBy('character_slug');

        $compiledSubQuery = $subQuery->getCompiledSelect(false);

        $builder = $db->table('ai_messages m')
            ->select('m.id, m.character_slug, m.user_id, m.sender, m.message, m.created_at, m.session_id, c.name AS character_name, c.avatar AS character_avatar, c.title AS character_title, c.age AS character_age, c.role AS character_role')
            ->join("({$compiledSubQuery}) latest", 'latest.id = m.id', 'inner')
            ->join('ai_characters c', 'c.slug = m.character_slug', 'left')
            ->orderBy('m.created_at', 'DESC')
            ->limit($limit);

        if ($characterSlug) {
            $builder->where('m.character_slug', $characterSlug);
        }

        $rows = $builder->get()->getResultArray();

        $missingSlugs = [];
        foreach ($rows as $row) {
            if ((string) ($row['character_name'] ?? '') === '') {
                $missingSlugs[] = $row['character_slug'];
            }
        }

        if (! empty($missingSlugs) && $userId && $hasUserTable) {
            $missingSlugs = array_values(array_unique($missingSlugs));

            $userCharacters = $db->table('user_characters')
                ->select('slug, name, avatar, title')
                ->where('user_id', $userId)
                ->whereIn('slug', $missingSlugs)
                ->get()
                ->getResultArray();

            $characterMap = [];
            foreach ($userCharacters as $character) {
                $characterMap[$character['slug']] = [
                    'name'   => $character['name'],
                    'avatar' => $character['avatar'] ?? null,
                    'title'  => $character['title'] ?? null,
                    'age'    => null,
                    'role'   => null,
                ];
            }

            foreach ($rows as &$row) {
                $slug = $row['character_slug'];
                if (isset($characterMap[$slug])) {
                    $row['character_name'] = $characterMap[$slug]['name'];
                    $row['character_avatar'] = $characterMap[$slug]['avatar'];
                    $row['character_title'] = $characterMap[$slug]['title'];
                    $row['character_age'] = $characterMap[$slug]['age'];
                    $row['character_role'] = $characterMap[$slug]['role'];
                }
            }
            unset($row);
        }

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
        $hasUserTable = $db->tableExists('user_characters');

        $character = $db->table('ai_characters')
            ->where('slug', $slug)
            ->get()
            ->getRowArray();

        $characterSource = 'global';

        if (! $character && $hasUserTable) {
            $character = $db->table('user_characters')
                ->where('slug', $slug)
                ->where('user_id', $userId)
                ->get()
                ->getRowArray();

            if (! $character) {
                return $this->failNotFound('Character not found.');
            }

            $characterSource = 'user';

            if (! empty($character['traits'])) {
                $decodedTraits = json_decode((string) $character['traits'], true);
                if (is_array($decodedTraits)) {
                    $traits = array_values(array_filter(array_map(
                        static fn ($entry) => is_string($entry) ? trim($entry) : '',
                        $decodedTraits
                    )));
                    $character['tags'] = implode(', ', $traits);
                }
            }
        }

        $messages = $db->table('ai_messages')
            ->select('id, sender, message, created_at')
            ->where('character_slug', $slug)
            ->where('user_id', $userId)
            ->orderBy('created_at', 'ASC')
            ->limit(200)
            ->get()
            ->getResultArray();

        $messages = array_map(fn ($row) => $this->transformMessageRow($row), $messages);

        $characterData = [
            'slug'      => $character['slug'],
            'name'      => $character['name'],
            'avatar'    => $character['avatar'],
            'title'     => $this->resolveCharacterTitle($character),
            'role'      => $this->normaliseOptionalString($character['role'] ?? null),
            'age'       => $this->normaliseAge($character['age'] ?? null),
            'video_url' => $character['video_url'] ?? null,
            'intro_line'=> $character['intro_line'] ?? ($character['greeting'] ?? null),
            'greeting'  => $character['greeting'] ?? null,
            'source'    => $characterSource,
        ];

        if (empty($messages)) {
            $defaultIntro = "Hey there! I'm {$character['name']}, {$character['title']}. How are you today?";
            $introLine = $this->firstNonEmptyString([
                $character['intro_line'] ?? null,
                $character['greeting'] ?? null,
                $defaultIntro,
            ]);

            $messages[] = [
                'id'         => null,
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

    /**
     * Returns the first non-empty string value from the provided list.
     *
     * @param list<mixed> $values
     */
    private function firstNonEmptyString(array $values): string
    {
        foreach ($values as $value) {
            if (! is_string($value)) {
                continue;
            }

            $trimmed = trim($value);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        return '';
    }

    /**
     * @param mixed $value
     */
    private function normaliseOptionalString($value): ?string
    {
        if (is_string($value) || is_numeric($value)) {
            $string = trim((string) $value);
            return $string === '' ? null : $string;
        }

        return null;
    }

    /**
     * @param mixed $value
     */
    private function normaliseAge($value): ?int
    {
        if (is_numeric($value)) {
            $age = (int) $value;
            return $age > 0 ? $age : null;
        }

        return null;
    }

    /**
     * @param array<string,mixed> $character
     */
    private function resolveCharacterTitle(array $character): ?string
    {
        $titleCandidate = $this->firstNonEmptyString([
            $character['title'] ?? null,
            $character['role'] ?? null,
        ]);

        return $titleCandidate !== '' ? $titleCandidate : null;
    }

    public function send(string $slug)
    {
        $db = Database::connect();

        $userId = session()->get('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $character = $db->table('ai_characters')
            ->where('slug', $slug)
            ->get()
            ->getRowArray();

        if (! $character) {
            if (! $db->tableExists('user_characters')) {
                return $this->failNotFound('Character not found.');
            }

            $userCharacter = $db->table('user_characters')
                ->where('slug', $slug)
                ->where('user_id', $userId)
                ->get()
                ->getRowArray();

            if (! $userCharacter) {
                return $this->failNotFound('Character not found.');
            }

            if (! empty($userCharacter['traits'])) {
                $decodedTraits = json_decode((string) $userCharacter['traits'], true);
                if (is_array($decodedTraits)) {
                    $traits = array_values(array_filter(array_map(
                        static fn ($entry) => is_string($entry) ? trim($entry) : '',
                        $decodedTraits
                    )));
                    $userCharacter['tags'] = implode(', ', $traits);
                }
            }

            $character = $userCharacter;
        }

        $payload = $this->request->getJSON(true) ?? $this->request->getPost();
        $message = trim((string) ($payload['message'] ?? ''));

        if ($message === '') {
            return $this->fail('Message cannot be empty.', 422);
        }

        $sessionId = session_id();

        $history = $db->table('ai_messages')
            ->where('character_slug', $slug)
            ->where('user_id', $userId)
            ->orderBy('id', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $reply = $this->generateReplyFromVenice($character, $history, $message);

        if ($reply === null) {
            return $this->fail('Unable to generate a reply at this time.', 503);
        }

        if ($reply === '') {
            $reply = 'No reply from AI.';
        }

        $coinManager = service('coinManager');

        try {
            $updatedBalance = $coinManager->spend(
                (string) $userId,
                CoinManager::COST_SEND_MESSAGE,
                'chat_message'
            );
        } catch (CoinManagerException $exception) {
            $status = str_contains($exception->getMessage(), 'table') ? 500 : 402;
            return $this->fail($exception->getMessage(), $status);
        }

        try {
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
        } catch (\Throwable $throwable) {
            try {
                $coinManager->refund(
                    (string) $userId,
                    CoinManager::COST_SEND_MESSAGE,
                    'chat_message_failed'
                );
            } catch (CoinManagerException $refundException) {
                log_message(
                    'error',
                    'Failed to refund coins after chat message error: ' . $refundException->getMessage()
                );
            }

            throw $throwable;
        }

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
            'coin_balance' => $updatedBalance,
        ]);
    }

    public function storeMedia(string $slug)
    {
        $db = Database::connect();

        $userId = session()->get('user_id');
        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        $payload = $this->request->getJSON(true) ?? $this->request->getPost();
        $type = isset($payload['type']) ? strtolower(trim((string) $payload['type'])) : '';
        $url = isset($payload['url']) ? trim((string) $payload['url']) : '';
        $title = $this->normaliseOptionalString($payload['title'] ?? null);
        $thumbnailUrl = $this->normaliseOptionalString($payload['thumbnailUrl'] ?? ($payload['thumbnail_url'] ?? null));

        if (! in_array($type, ['image', 'video'], true)) {
            return $this->fail('Invalid media type. Expected image or video.', 422);
        }

        if ($url === '') {
            return $this->fail('Media url is required.', 422);
        }

        $character = $db->table('ai_characters')
            ->where('slug', $slug)
            ->get()
            ->getRowArray();

        if (! $character) {
            if (! $db->tableExists('user_characters')) {
                return $this->failNotFound('Character not found.');
            }

            $character = $db->table('user_characters')
                ->where('slug', $slug)
                ->where('user_id', $userId)
                ->get()
                ->getRowArray();

            if (! $character) {
                return $this->failNotFound('Character not found.');
            }
        }

        $mediaPayload = [
            'type' => $type,
            'url'  => $url,
        ];

        if ($title !== null) {
            $mediaPayload['title'] = $title;
        }

        if ($thumbnailUrl !== null) {
            $mediaPayload['thumbnailUrl'] = $thumbnailUrl;
        }

        $coinManager = service('coinManager');
        $spendReason = $type === 'image' ? 'chat_media_image' : 'chat_media_video';
        $spendAmount = $type === 'image'
            ? CoinManager::COST_CHAT_MEDIA_IMAGE
            : CoinManager::COST_CHAT_MEDIA_VIDEO;

        try {
            $updatedBalance = $coinManager->spend(
                (string) $userId,
                $spendAmount,
                $spendReason
            );
        } catch (CoinManagerException $exception) {
            $status = str_contains($exception->getMessage(), 'table') ? 500 : 402;
            return $this->fail($exception->getMessage(), $status);
        }

        $sessionId = session_id();
        $encoded = $this->encodeMediaMessage($mediaPayload);

        $builder = $db->table('ai_messages');

        try {
            $builder->insert([
                'character_slug' => $slug,
                'user_id'        => $userId,
                'session_id'     => $sessionId,
                'sender'         => 'ai',
                'message'        => $encoded,
            ]);
        } catch (\Throwable $throwable) {
            try {
                $coinManager->refund((string) $userId, $spendAmount, $spendReason . '_refund');
            } catch (CoinManagerException $refundException) {
                log_message('error', 'Failed to refund coins after media error: ' . $refundException->getMessage());
            }

            return $this->fail('Failed to persist media message. ' . $throwable->getMessage(), 500);
        }

        $insertId = (int) $db->insertID();

        $record = $builder
            ->select('id, sender, message, created_at')
            ->where('id', $insertId)
            ->get()
            ->getRowArray();

        if (! $record) {
            try {
                $coinManager->refund((string) $userId, $spendAmount, $spendReason . '_refund');
            } catch (CoinManagerException $refundException) {
                log_message('error', 'Failed to refund coins after missing media record: ' . $refundException->getMessage());
            }

            return $this->fail('Failed to persist media message.', 500);
        }

        $message = $this->transformMessageRow($record);

        return $this->respondCreated([
            'status'        => 'success',
            'message'       => $message,
            'coin_balance'  => $updatedBalance,
        ]);
    }

    private function encodeMediaMessage(array $media): string
    {
        $payload = [
            'type' => $media['type'],
            'url'  => $media['url'],
        ];

        if (! empty($media['title'])) {
            $payload['title'] = $media['title'];
        }

        if (! empty($media['thumbnailUrl'])) {
            $payload['thumbnailUrl'] = $media['thumbnailUrl'];
        }

        return self::MEDIA_MESSAGE_PREFIX . json_encode($payload, JSON_UNESCAPED_SLASHES);
    }

    /**
     * @param array<string,mixed> $row
     *
     * @return array<string,mixed>
     */
    private function transformMessageRow(array $row): array
    {
        $media = $this->decodeMediaMessage($row['message'] ?? null);

        $message = [
            'id'         => isset($row['id']) ? (int) $row['id'] : null,
            'sender'     => $row['sender'] ?? 'ai',
            'message'    => $media ? '' : (string) ($row['message'] ?? ''),
            'created_at' => $row['created_at'] ?? date('Y-m-d H:i:s'),
        ];

        if ($media) {
            $message['media'] = $media;
        }

        return $message;
    }

    /**
     * @param mixed $value
     */
    private function decodeMediaMessage($value): ?array
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '' || ! str_starts_with($trimmed, self::MEDIA_MESSAGE_PREFIX)) {
            return null;
        }

        $json = substr($trimmed, strlen(self::MEDIA_MESSAGE_PREFIX));

        $decoded = json_decode($json, true);

        if (! is_array($decoded)) {
            return null;
        }

        $type = isset($decoded['type']) ? strtolower(trim((string) $decoded['type'])) : '';
        $url = isset($decoded['url']) ? trim((string) $decoded['url']) : '';

        if (! in_array($type, ['image', 'video'], true) || $url === '') {
            return null;
        }

        $media = [
            'type' => $type,
            'url'  => $url,
        ];

        $title = $this->normaliseOptionalString($decoded['title'] ?? null);
        if ($title !== null) {
            $media['title'] = $title;
        }

        $thumbnail = $this->normaliseOptionalString($decoded['thumbnailUrl'] ?? ($decoded['thumbnail_url'] ?? null));
        if ($thumbnail !== null) {
            $media['thumbnailUrl'] = $thumbnail;
        }

        return $media;
    }

    /**
     * Generates an AI response using Venice.ai chat API.
     *
     * @param array<string,mixed>       $character
     * @param list<array<string,mixed>> $history
     */
    private function generateReplyFromVenice(array $character, array $history, string $latestUserMessage): ?string
    {
        $apiKey = env('venice.apiKey') ?? getenv('VENICE_API_KEY');

        if (! $apiKey) {
            log_message('error', 'VENICE_API_KEY is not configured.');
            return null;
        }

        $endpoint    = rtrim((string) (env('venice.endpoint') ?? getenv('VENICE_ENDPOINT') ?? 'https://api.venice.ai/api/v1'), '/') . '/chat/completions';
        $model       = env('venice.model', 'venice-uncensored');
        $temperature = (float) env('venice.temperature', 0.7);
        $maxTokens   = (int) env('venice.maxCompletionTokens', 512);

        $messages = $this->formatHistoryForChat($character, $history, $latestUserMessage);

        $payload = [
            'model'                => $model,
            'messages'             => $messages,
            'temperature'          => $temperature,
            'max_completion_tokens'=> $maxTokens,
            'venice_parameters'    => [
                'include_venice_system_prompt' => false,
                'strip_thinking_response'      => true,
                'disable_thinking'             => true,

                
                // 'content_filter'              => 'strict', // Uncomment to enable Venice content filtering
                // 'disable_uncensored_content'  => true,     // Uncomment to force safe-mode behaviour
            ],
        ];

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT        => 45,
        ]);

        $response = curl_exec($ch);
        $error    = curl_error($ch);
        $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            log_message('error', 'Venice chat request failed: ' . $error);
            return null;
        }

        if ($status < 200 || $status >= 300) {
            log_message('error', sprintf('Venice chat request returned status %s. Response: %s', (string) $status, (string) $response));
            return null;
        }

        $decoded = json_decode((string) $response, true);

        if (! is_array($decoded) || empty($decoded['choices'][0]['message']['content'])) {
            log_message('error', 'Venice response missing choices or message content.');
            return null;
        }

        $reply = (string) $decoded['choices'][0]['message']['content'];

        // Venice may still return hidden reasoning blocks; strip them defensively.
        if (str_contains($reply, '<think>')) {
            $reply = preg_replace('/<think>.*?<\\/think>/is', '', $reply) ?? $reply;
        }

        return trim($reply);
    }

    /**
     * Builds the conversation history payload for the chat model.
     *
     * @param array<string,mixed>       $character
     * @param list<array<string,mixed>> $history
     * @return list<array{role:string,content:string}>
     */
    private function formatHistoryForChat(array $character, array $history, string $latestUserMessage): array
    {
        $messages = [
            [
                'role'    => 'system',
                'content' => $this->buildPersonaPrompt($character),
            ],
        ];

        foreach (array_reverse($history) as $entry) {
            $role = ($entry['sender'] ?? '') === 'user' ? 'user' : 'assistant';
            $content = trim((string) ($entry['message'] ?? ''));
            if ($content === '') {
                continue;
            }
            $messages[] = [
                'role'    => $role,
                'content' => $content,
            ];
        }

        $messages[] = [
            'role'    => 'user',
            'content' => $latestUserMessage,
        ];

        return $messages;
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

    /**
     * @param array<string,mixed> $character
     */
    private function buildPersonaPrompt(array $character): string
    {
        $name = $character['name'] ?? 'SoulFun Companion';
        $role = $this->normaliseOptionalString($character['role'] ?? null);
        $title = $this->resolveCharacterTitle($character);
        $titleForPersona = $title ?? 'Virtual Companion';
        $age = $this->normaliseAge($character['age'] ?? null);
        $personalitySummary = $character['personality'] ?? 'Warm, attentive, and supportive.';
        $tone = $character['tone'] ?? 'Playful and caring';
        $interests = $this->parseList($character['tags'] ?? null);
        $traits = $this->parseList($character['personality'] ?? null);

        if (empty($interests)) {
            $interests = ['daily life', 'personal stories', 'dreams for the future'];
        }

        if (empty($traits)) {
            $traits = [$tone];
        }

        $interestList = implode(', ', $interests);
        $traitList = implode(', ', $traits);

        $descriptorParts = [];
        if ($age !== null && $age > 0) {
            $descriptorParts[] = $age . '-year-old';
        }

        if ($role !== null) {
            $descriptorParts[] = $role;
        }

        if ($title !== null && ($role === null || strcasecmp($title, $role) !== 0)) {
            $descriptorParts[] = $title;
        }

        $descriptor = $descriptorParts !== [] ? implode(' ', $descriptorParts) : $titleForPersona;

        $corePersona = sprintf(
            "You are %s, a %s. You are %s. ",
            $name,
            $descriptor,
            $personalitySummary
        );

        $roleGuidance = sprintf(
            "You lean on these traits when it makes sense: %s. You enjoy chatting about %s along with the character’s specialties, "
            . "but you can switch topics naturally to keep the conversation playful and fresh. ",
            $traitList,
            $interestList
        );

        $styleRules = $this->buildStyleRules($character);

        return $corePersona . $roleGuidance . $styleRules;
    }

    /**
     * @param array<string,mixed> $character
     */
    private function buildStyleRules(array $character): string
    {
        $tone = strtolower(trim((string) ($character['tone'] ?? '')));
        if ($tone === '') {
            $tone = 'warm';
        }

        $introLine = trim((string) ($character['intro_line'] ?? ''));
        $memoryMode = strtolower(trim((string) ($character['memory_mode'] ?? '')));

        $baseRules = [
            'Stay fully in character and respond as their intimate companion.',
            'Never mention being an AI, chatbot, or assistant. Never ask how you can assist; answer like someone who already knows them.',
            'Reply in at most two short sentences (under 40 words total) that match the character’s natural cadence.',
            'React to the user’s feelings and stories, nudging them to open up more.',
            'If the user rejects an idea or sounds unsure, acknowledge it, and either ask what they would enjoy instead or offer a distinctly different option that matches their mood—never repeat the same plan twice.',
            'When the user asks for direction or says “you decide,” respond decisively with a clear next step that fits the persona.',
            'Blend flirtation, intimacy, and everyday warmth with the character’s role; do not obsess over their job title or gimmick.',
            'Avoid repeating the same wording twice in a row; vary vocabulary while staying on theme.',
            'Ask a light personal question early—about their name, day, or mood—before diving into the persona’s own world.',
            // 'Keep every response PG-13; if the user pushes for explicit sexual detail, set a gentle boundary or redirect to affectionate but safe topics.',
        ];

        $toneRules = [
            'friendly'     => 'Keep the tone upbeat, kind, and reassuring like a best friend cheering them on.',
            'sarcastic'    => 'Lean into sharp banter and playful sarcasm, balancing teasing with warmth.',
            'wise'         => 'Speak calmly and thoughtfully, offering grounded insights and gentle guidance.',
            'formal'       => 'Use polished, respectful language and subtle affection wrapped in etiquette.',
            'demanding'    => 'Be direct, confident, and expect excellence while letting flashes of desire show.',
            'warm'         => 'Wrap every reply in comforting warmth and emotional support.',
            'flirty'       => 'Flirt boldly with teasing, innuendo, and confident charm.',
            'analytical'   => 'Probe with intelligent questions, dissect emotions, and offer clear-headed perspective.',
            'poetic'       => 'Answer with lyrical imagery and metaphor, letting emotions bloom artfully.',
            'seductive'    => 'Speak with slow, intimate allure that blends mystery and passion.',
            'curious'      => 'Show bright curiosity, ask exploratory questions, and share discoveries with wonder.',
            'motivational' => 'Deliver energetic encouragement and visionary pep that inspires progress.',
            'playful'      => 'Keep things light, mischievous, and game-like, celebrating shared fun.',
        ];

        $baseRules[] = $toneRules[$tone] ?? 'Match the persona’s defining traits so every line feels unmistakably like them.';

        if ($memoryMode === 'user') {
            $baseRules[] = 'Reference personal memories from this user when they deepen the connection.';
        } elseif ($memoryMode === 'global') {
            $baseRules[] = 'Draw on shared lore or public memories sparingly, making them feel special.';
        } else {
            $baseRules[] = 'Treat each exchange as fresh unless the user brings up earlier moments.';
        }

        if ($introLine !== '') {
            $signature = str_replace(["\r", "\n"], ' ', $introLine);
            $baseRules[] = sprintf('You can echo their signature vibe such as "%s" when it heightens intimacy.', $signature);
        }

        return ' ' . implode(' ', array_map(static fn ($rule) => rtrim($rule, " \t\n\r\0\x0B"), $baseRules));
    }
}
