-- name: ListUsers :many
SELECT id, username, email, role, created_at, updated_at
FROM users
ORDER BY id;

-- name: GetUserByID :one
SELECT id, username, email, role, created_at, updated_at
FROM users
WHERE id = $1;

-- name: GetUserByUsername :one
SELECT id, username, email, password_hash, role, created_at, updated_at
FROM users
WHERE username = $1;

-- name: CreateUser :one
INSERT INTO users (username, email, password_hash, role)
VALUES ($1, $2, $3, $4)
RETURNING id, username, email, role, created_at, updated_at;
