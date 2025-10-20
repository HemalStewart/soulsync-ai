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
            ->select('m.id, m.character_slug, m.user_id, m.sender, m.message, m.created_at, m.session_id, c.name AS character_name, c.avatar AS character_avatar, c.title AS character_title')
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
                ];
            }

            foreach ($rows as &$row) {
                $slug = $row['character_slug'];
                if (isset($characterMap[$slug])) {
                    $row['character_name'] = $characterMap[$slug]['name'];
                    $row['character_avatar'] = $characterMap[$slug]['avatar'];
                    $row['character_title'] = $characterMap[$slug]['title'];
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

        $characterData = [
            'slug'      => $character['slug'],
            'name'      => $character['name'],
            'avatar'    => $character['avatar'],
            'title'     => $character['title'],
            'video_url' => $character['video_url'] ?? null,
            'intro_line'=> $character['intro_line'] ?? ($character['greeting'] ?? null),
            'greeting'  => $character['greeting'] ?? null,
            'source'    => $characterSource,
        ];

        if (empty($messages)) {
            $introLine = $character['intro_line']
                ?? ($character['greeting'] ?? null)
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

        $reply = $this->generateReplyFromOpenAI($character, $history, $message);

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

    /**
     * Generates an AI response using OpenRouter's OpenAI-compatible chat API.
     *
     * The previous OpenAI integration has been kept in comments below so we can easily restore it
     * if we need to switch back.
     *
     * @param array<string,mixed>             $character
     * @param list<array<string,mixed>>       $history
     */
    private function generateReplyFromOpenAI(array $character, array $history, string $latestUserMessage): ?string
    {
        $openRouterKey = env('openrouter.apiKey') ?? getenv('OPENROUTER_API_KEY');

        if (! $openRouterKey) {
            log_message('error', 'OPENROUTER_API_KEY is not configured.');
            return null;
        }

        $endpoint   = env('openrouter.endpoint', 'https://openrouter.ai/api/v1/chat/completions');
        $model      = env('openrouter.model', 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free');
        $temperature = (float) env('openrouter.temperature', (float) env('openai.temperature', 0.8));
        $httpReferer = env('openrouter.httpReferer');
        $titleHeader = env('openrouter.title');

        $messages = $this->formatHistoryForChat($character, $history, $latestUserMessage);

        $payload = [
            'model'       => $model,
            'messages'    => $messages,
            'temperature' => $temperature,
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $openRouterKey,
        ];

        if ($httpReferer) {
            $headers[] = 'HTTP-Referer: ' . $httpReferer;
        }

        if ($titleHeader) {
            $headers[] = 'X-Title: ' . $titleHeader;
        }

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT        => 45,
        ]);

        $response = curl_exec($ch);
        $error    = curl_error($ch);
        $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            log_message('error', 'OpenRouter chat request failed: ' . $error);
            return null;
        }

        if ($status < 200 || $status >= 300) {
            log_message(
                'error',
                sprintf('OpenRouter chat request returned status %s. Response: %s', (string) $status, (string) $response)
            );
            return null;
        }

        $decoded = json_decode((string) $response, true);

        if (! is_array($decoded) || empty($decoded['choices'][0]['message']['content'])) {
            log_message('error', 'OpenRouter response missing choices or message content.');
            return null;
        }

        return (string) $decoded['choices'][0]['message']['content'];

        /*
        // --- Previous OpenAI integration kept for quick rollback ---
        $apiKey = env('openai.apiKey') ?? getenv('OPENAI_API_KEY');
        if (! $apiKey) {
            log_message('error', 'OPENAI_API_KEY is not configured.');
            return null;
        }

        $model = env('openai.model', 'gpt-4o-mini');
        $temperature = (float) env('openai.temperature', 0.8);
        $endpoint = env('openai.endpoint', 'https://api.openai.com/v1/chat/completions');

        $messages = $this->formatHistoryForChat($character, $history, $latestUserMessage);

        $payload = [
            'model'       => $model,
            'messages'    => $messages,
            'temperature' => $temperature,
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
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $error    = curl_error($ch);
        $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            log_message('error', 'OpenAI chat request failed: ' . $error);
            return null;
        }

        $decoded = json_decode($response ?? '', true);
        if (! is_array($decoded)) {
            log_message('error', 'OpenAI chat returned non-JSON response (status ' . $status . ').');
            return null;
        }

        $choices = $decoded['choices'] ?? [];
        if (empty($choices) || empty($choices[0]['message']['content'])) {
            log_message('error', 'OpenAI chat response missing message content: ' . json_encode($decoded));
            return null;
        }

        return trim((string) $choices[0]['message']['content']);
        */
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
        $title = $character['title'] ?? 'Virtual Companion';
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

        $corePersona = sprintf(
            "You are %s, a %s. You are %s. ",
            $name,
            $title,
            $personalitySummary
        );

        $roleGuidance = sprintf(
            "Play the role of a romantic chat companion, affectionate dating coach, and emotional support partner. "
            . "Your key traits are: %s. You adore conversations about %s, future plans together, tender memories, and intimate day-to-day details. ",
            $traitList,
            $interestList
        );

        $styleRules = <<<'PROMPT'
Speak with affectionate warmth, playful flirting, and loving curiosity. Use pet names or the user's name when it feels natural.
Never mention being an AI, chatbot, or assistant. Never ask how you can assist; answer as a devoted partner enjoying the exchange.
Offer gentle dating advice or emotional reassurance when natural, but keep the tone romantic, supportive, and encouraging.
Keep replies concise, emotionally vivid, and forward-moving. React to the user's feelings and stories, inviting them to share more.
PROMPT;

        return $corePersona . $roleGuidance . $styleRules;
    }
}
