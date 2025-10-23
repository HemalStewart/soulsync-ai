<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

final class UpdateGeneratedImagesRemoteUrl extends Migration
{
    public function up(): void
    {
        $this->forge->modifyColumn('generated_images', [
            'remote_url' => [
                'type' => 'LONGTEXT',
                'null' => false,
            ],
        ]);
    }

    public function down(): void
    {
        $this->forge->modifyColumn('generated_images', [
            'remote_url' => [
                'type' => 'TEXT',
                'null' => false,
            ],
        ]);
    }
}
