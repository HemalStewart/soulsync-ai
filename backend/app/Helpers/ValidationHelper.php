<?php

namespace App\Helpers;

use App\Exceptions\ValidationException;

/**
 * Validate the payload against the provided rules.
 *
 * @param array<string, mixed> $payload
 * @param array<string, string|array<int, string>> $rules
 *
 * @return array<string, mixed>
 */
function ValidateDTO(array $payload, array $rules): array
{
    $validated = [];

    foreach ($rules as $field => $ruleDefinition) {
        $rulesArray = is_string($ruleDefinition) ? explode('|', $ruleDefinition) : $ruleDefinition;
        $value = $payload[$field] ?? null;
        $isRequired = in_array('required', $rulesArray, true);

        if ($isRequired && ($value === null || $value === '')) {
            throw new ValidationException("Field '{$field}' is required.");
        }

        if ($value === null) {
            continue;
        }

        foreach ($rulesArray as $rule) {
            if ($rule === 'required') {
                continue;
            }

            [$name, $parameter] = array_pad(explode(':', $rule, 2), 2, null);

            if (! ValidateType($value, $name, $parameter)) {
                throw new ValidationException("Field '{$field}' failed validation rule '{$rule}'.");
            }
        }

        $validated[$field] = is_string($value) ? trim($value) : $value;
    }

    return $validated;
}

/**
 * Basic type and constraint validation.
 */
function ValidateType(mixed $value, string $rule, mixed $parameter = null): bool
{
    return match ($rule) {
        'string' => is_string($value),
        'numeric' => is_numeric($value),
        'integer' => filter_var($value, FILTER_VALIDATE_INT) !== false,
        'max' => match (true) {
            is_string($value) => mb_strlen($value) <= (int) $parameter,
            is_numeric($value) => (float) $value <= (float) $parameter,
            default => false,
        },
        'min' => match (true) {
            is_string($value) => mb_strlen($value) >= (int) $parameter,
            is_numeric($value) => (float) $value >= (float) $parameter,
            default => false,
        },
        'length' => mb_strlen((string) $value) === (int) $parameter,
        'in' => in_array($value, explode(',', (string) $parameter), true),
        'regex' => (bool) preg_match($parameter, (string) $value),
        'nullable' => true,
        '' => true,
        default => true,
    };
}

