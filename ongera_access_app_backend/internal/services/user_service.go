// Package services contains sample business logic.
// Domain rules (patient access, prescriptions, reports) belong here when implemented.
package services

import (
	"context"
	"errors"
	"fmt"

	"ongera_access_app_backend/internal/auth"
	"ongera_access_app_backend/internal/models"
	"ongera_access_app_backend/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserExists         = errors.New("user already exists")
)

type UserService struct {
	repo *repository.UserRepository
	auth *auth.Service
}

func NewUserService(repo *repository.UserRepository, authService *auth.Service) *UserService {
	return &UserService{repo: repo, auth: authService}
}

func (s *UserService) ListUsers(ctx context.Context) ([]models.User, error) {
	return s.repo.ListUsers(ctx)
}

func (s *UserService) Login(ctx context.Context, req models.LoginRequest) (models.LoginResponse, error) {
	user, passwordHash, err := s.repo.GetByUsername(ctx, req.Username)
	if err != nil {
		return models.LoginResponse{}, ErrInvalidCredentials
	}

	if !s.auth.CheckPassword(passwordHash, req.Password) {
		return models.LoginResponse{}, ErrInvalidCredentials
	}

	token, err := s.auth.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return models.LoginResponse{}, fmt.Errorf("generate token: %w", err)
	}

	return models.LoginResponse{Token: token, User: user}, nil
}

func (s *UserService) CreateUser(ctx context.Context, req models.CreateUserRequest) (models.User, error) {
	role := req.Role
	if role == "" {
		role = models.RolePatient
	}

	hash, err := s.auth.HashPassword(req.Password)
	if err != nil {
		return models.User{}, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.repo.CreateUser(ctx, req.Username, req.Email, hash, role)
	if err != nil {
		return models.User{}, fmt.Errorf("%w: %v", ErrUserExists, err)
	}

	return user, nil
}
