// Package repository wraps sqlc-generated queries.
// Sample: UserRepository only — add repositories per domain table later.
package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"ongera_access_app_backend/internal/models"
	"ongera_access_app_backend/internal/repository/sqlc"
)

type UserRepository struct {
	queries *sqlc.Queries
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{queries: sqlc.New(pool)}
}

func (r *UserRepository) ListUsers(ctx context.Context) ([]models.User, error) {
	rows, err := r.queries.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}

	users := make([]models.User, 0, len(rows))
	for _, row := range rows {
		users = append(users, models.User{
			ID:        row.ID,
			Username:  row.Username,
			Email:     row.Email,
			Role:      row.Role,
			CreatedAt: timestamptz(row.CreatedAt),
			UpdatedAt: timestamptz(row.UpdatedAt),
		})
	}
	return users, nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (models.User, string, error) {
	row, err := r.queries.GetUserByUsername(ctx, username)
	if err != nil {
		return models.User{}, "", fmt.Errorf("get user by username: %w", err)
	}

	return models.User{
		ID:        row.ID,
		Username:  row.Username,
		Email:     row.Email,
		Role:      row.Role,
		CreatedAt: timestamptz(row.CreatedAt),
		UpdatedAt: timestamptz(row.UpdatedAt),
	}, row.PasswordHash, nil
}

func (r *UserRepository) CreateUser(ctx context.Context, username, email, passwordHash, role string) (models.User, error) {
	row, err := r.queries.CreateUser(ctx, sqlc.CreateUserParams{
		Username:     username,
		Email:        email,
		PasswordHash: passwordHash,
		Role:         role,
	})
	if err != nil {
		return models.User{}, fmt.Errorf("create user: %w", err)
	}

	return models.User{
		ID:        row.ID,
		Username:  row.Username,
		Email:     row.Email,
		Role:      row.Role,
		CreatedAt: timestamptz(row.CreatedAt),
		UpdatedAt: timestamptz(row.UpdatedAt),
	}, nil
}

func timestamptz(value pgtype.Timestamptz) time.Time {
	if !value.Valid {
		return time.Time{}
	}
	return value.Time
}
