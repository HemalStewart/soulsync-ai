<?php

namespace App\Libraries;

use CodeIgniter\Database\BaseConnection;
use Config\Database;
use RuntimeException;

class CoinManager
{
    public const DEFAULT_STARTING_BALANCE = 20;
    public const COST_GENERATE_IMAGE = 5;
    public const COST_SEND_MESSAGE = 1;

    private ?BaseConnection $db = null;

    private function db(): BaseConnection
    {
        if ($this->db === null) {
            $this->db = Database::connect();
        }

        return $this->db;
    }

    /**
     * Ensures the user has a coin record and returns the current balance.
     */
    public function getBalance(string $userId): int
    {
        if ($userId === '') {
            throw new CoinManagerException('Invalid user.');
        }

        $db = $this->db();

        if (! $db->tableExists('user_coins')) {
            throw new CoinManagerException('Coin storage table is missing.');
        }

        $record = $db->table('user_coins')
            ->select('balance')
            ->where('user_id', $userId)
            ->get()
            ->getRowArray();

        if ($record) {
            return (int) $record['balance'];
        }

        $this->initialiseBalance($userId, $db);

        $record = $db->table('user_coins')
            ->select('balance')
            ->where('user_id', $userId)
            ->get()
            ->getRowArray();

        return $record ? (int) $record['balance'] : self::DEFAULT_STARTING_BALANCE;
    }

    /**
     * Deducts coins and returns the updated balance.
     */
    public function spend(string $userId, int $amount, string $reason = ''): int
    {
        if ($amount <= 0) {
            throw new CoinManagerException('Spend amount must be positive.');
        }

        $db = $this->db();

        if (! $db->tableExists('user_coins')) {
            throw new CoinManagerException('Coin storage table is missing.');
        }

        $db->transStart();

        $record = $this->lockBalanceRow($userId, $db);

        if (! $record) {
            $this->initialiseBalance($userId, $db);

            $record = $this->lockBalanceRow($userId, $db);

            if (! $record) {
                $db->transRollback();
                throw new CoinManagerException('Failed to initialise coin balance.');
            }
        }

        $currentBalance = (int) $record['balance'];

        if ($currentBalance < $amount) {
            $db->transRollback();
            throw new CoinManagerException('You have no coins left. Please top up to continue.');
        }

        $newBalance = $currentBalance - $amount;

        $db->table('user_coins')
            ->where('user_id', $userId)
            ->update([
                'balance'    => $newBalance,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        $this->logTransaction($db, $userId, -$amount, $reason, 'spend');

        $db->transComplete();

        if (! $db->transStatus()) {
            throw new CoinManagerException('Failed to update coin balance.');
        }

        return $newBalance;
    }

    /**
     * Adds coins back to the user's balance (e.g. refunds).
     */
    public function refund(string $userId, int $amount, string $reason = ''): int
    {
        if ($amount <= 0) {
            throw new CoinManagerException('Refund amount must be positive.');
        }

        $db = $this->db();

        if (! $db->tableExists('user_coins')) {
            throw new CoinManagerException('Coin storage table is missing.');
        }

        $db->transStart();

        $record = $this->lockBalanceRow($userId, $db);

        if (! $record) {
            $this->initialiseBalance($userId, $db);
            $record = $this->lockBalanceRow($userId, $db);

            if (! $record) {
                $db->transRollback();
                throw new CoinManagerException('Failed to initialise coin balance.');
            }
        }

        $currentBalance = (int) $record['balance'];
        $newBalance = $currentBalance + $amount;

        $db->table('user_coins')
            ->where('user_id', $userId)
            ->update([
                'balance'    => $newBalance,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        $this->logTransaction($db, $userId, $amount, $reason, 'refund');

        $db->transComplete();

        if (! $db->transStatus()) {
            throw new CoinManagerException('Failed to update coin balance.');
        }

        return $newBalance;
    }

    /**
     * Returns true if the user has the requested amount available.
     */
    public function hasEnough(string $userId, int $amount): bool
    {
        return $this->getBalance($userId) >= $amount;
    }

    private function initialiseBalance(string $userId, BaseConnection $db): void
    {
        $now = date('Y-m-d H:i:s');

        $db->query(
            'INSERT INTO user_coins (user_id, balance, created_at, updated_at)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)',
            [$userId, self::DEFAULT_STARTING_BALANCE, $now, $now]
        );
    }

    /**
     * @return array<string,mixed>|null
     */
    private function lockBalanceRow(string $userId, BaseConnection $db): ?array
    {
        $query = $db->query(
            'SELECT balance FROM user_coins WHERE user_id = ? FOR UPDATE',
            [$userId]
        );

        return $query->getRowArray() ?: null;
    }

    private function logTransaction(
        BaseConnection $db,
        string $userId,
        int $amount,
        string $reason,
        string $type
    ): void {
        if (! $db->tableExists('user_coin_transactions')) {
            return;
        }

        $db->table('user_coin_transactions')->insert([
            'user_id' => $userId,
            'amount' => $amount,
            'type' => $type,
            'reason' => $reason !== '' ? $reason : null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }
}

class CoinManagerException extends RuntimeException
{
}
