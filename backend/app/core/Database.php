<?php

namespace App\Core;

use App\Exceptions\SomethingWentWrongException;
use PDO;
use PDOException;
use PDOStatement;

class Database
{
    private static ?PDO $connection = null;

    /**
     * Returns a shared PDO connection instance.
     */
    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $configPath = __DIR__ . '/config/database.php';
        if (! is_file($configPath)) {
            throw new SomethingWentWrongException('Database configuration file is missing.');
        }

        $config = require $configPath;
        $dsn = sprintf(
            '%s:host=%s;port=%s;dbname=%s;charset=%s',
            $config['driver'] ?? 'mysql',
            $config['host'] ?? '127.0.0.1',
            $config['port'] ?? '3306',
            $config['database'] ?? '',
            $config['charset'] ?? 'utf8mb4',
        );

        try {
            self::$connection = new PDO(
                $dsn,
                $config['username'] ?? '',
                $config['password'] ?? '',
                $config['options'] ?? [],
            );
        } catch (PDOException $exception) {
            throw new SomethingWentWrongException('Unable to establish database connection.', previous: $exception);
        }

        return self::$connection;
    }

    /**
     * Prepare a SQL statement against the shared connection.
     */
    public static function prepare(string $query): PDOStatement
    {
        try {
            return self::connection()->prepare($query);
        } catch (PDOException $exception) {
            throw new SomethingWentWrongException('Failed to prepare database query.', previous: $exception);
        }
    }

    /**
     * Execute a prepared statement with bound parameters.
     */
    public static function handlePrepareQuery(PDOStatement $statement, array $params = []): PDOStatement
    {
        try {
            $statement->execute($params);
        } catch (PDOException $exception) {
            throw new SomethingWentWrongException('Executing prepared query failed.', previous: $exception);
        }

        return $statement;
    }

    /**
     * Wrap a callback inside a database transaction.
     *
     * @template T
     *
     * @param callable():T $callback
     *
     * @return T
     */
    public static function transaction(callable $callback)
    {
        $connection = self::connection();
        $connection->beginTransaction();

        try {
            $result = $callback();
            $connection->commit();

            return $result;
        } catch (\Throwable $throwable) {
            $connection->rollBack();
            throw $throwable;
        }
    }
}

