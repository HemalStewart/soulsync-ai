<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUserCharactersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 120,
            ],
            'slug' => [
                'type'       => 'VARCHAR',
                'constraint' => 160,
            ],
            'avatar' => [
                'type' => 'LONGTEXT',
                'null' => true,
            ],
            'title' => [
                'type'       => 'VARCHAR',
                'constraint' => 150,
                'null'       => true,
            ],
            'personality' => [
                'type' => 'TEXT',
            ],
            'backstory' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'expertise' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'traits' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'greeting' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'voice' => [
                'type'       => 'VARCHAR',
                'constraint' => 60,
                'null'       => true,
            ],
            'tone' => [
                'type'       => 'VARCHAR',
                'constraint' => 40,
                'null'       => true,
            ],
            'memory_mode' => [
                'type'    => 'ENUM',
                'constraint' => ['user', 'global', 'none'],
                'default' => 'user',
            ],
            'visibility' => [
                'type'       => 'ENUM',
                'constraint' => ['private', 'public'],
                'default'    => 'private',
            ],
            'is_active' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'created_at' => [
                'type'    => 'DATETIME',
                'null'    => false,
            ],
            'updated_at' => [
                'type'    => 'DATETIME',
                'null'    => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('user_id');
        $this->forge->addUniqueKey('slug');
        $this->forge->addForeignKey('user_id', 'user', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('user_characters');
    }

    public function down()
    {
        $this->forge->dropTable('user_characters', true);
    }
}

