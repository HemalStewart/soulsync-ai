<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'user';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $allowedFields = [
        'id',
        'mobile',
        'password',
        'email',
        'invite_code',
        'oauth_provider',
        'oauth_id',
        'avatar',
        'reg_datetime',
        'status'
    ];
    public $timestamps = false;
}

