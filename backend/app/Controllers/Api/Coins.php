<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\CoinManager;
use App\Libraries\CoinManagerException;
use CodeIgniter\API\ResponseTrait;

class Coins extends BaseController
{
    use ResponseTrait;

    private CoinManager $coins;

    public function __construct()
    {
        $this->coins = service('coinManager');
    }

    public function index()
    {
        $userId = session('user_id');

        if (! $userId) {
            return $this->fail('Please log in first.', 401);
        }

        try {
            $balance = $this->coins->getBalance((string) $userId);
        } catch (CoinManagerException $exception) {
            return $this->fail($exception->getMessage(), 500);
        }

        return $this->respond([
            'status'  => 'success',
            'balance' => $balance,
        ]);
    }
}
