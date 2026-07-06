// Package models holds sample request/response types and user role constants.
package models

import "time"

const (
	RolePatient   = "patient"
	RoleDoctor    = "doctor"
	RoleCaregiver = "caregiver"
	RoleAdmin     = "admin"
)

type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=64"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"omitempty,oneof=patient doctor caregiver admin"`
}

type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
