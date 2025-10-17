<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use Config\Database;

class Characters extends BaseController
{
    public function index()
    {
        $db = Database::connect();

        $rows = $db->table('ai_characters')
            ->select('id, name, slug, avatar, title, personality, expertise, tone, tags, video_url, created_at, is_active')
            ->where('is_active', 1)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();

        return $this->response->setJSON([
            'status' => 'success',
            'count'  => count($rows),
            'data'   => $rows,
        ]);
    }
}
