<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateGeneratedImageReportsTable extends Migration
{
    private const ALLOWED_REASONS = [
        'sexual_content',
        'violent_content',
        'hate_speech',
        'self_harm',
        'spam',
        'other',
    ];

    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'generated_image_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'reporter_user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
            ],
            'reason' => [
                'type'       => 'ENUM',
                'constraint' => self::ALLOWED_REASONS,
            ],
            'details' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'snapshot_remote_url' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'snapshot_prompt' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'snapshot_negative_prompt' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('generated_image_id');
        $this->forge->addKey('reporter_user_id');
        $this->forge->addUniqueKey(['generated_image_id', 'reporter_user_id']);

        $this->forge->addForeignKey(
            'generated_image_id',
            'generated_images',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->forge->addForeignKey(
            'reporter_user_id',
            'user',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->forge->createTable('generated_image_reports');
    }

    public function down()
    {
        $this->forge->dropTable('generated_image_reports', true);
    }
}
