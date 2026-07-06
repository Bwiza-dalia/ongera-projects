package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"ongera_access_app_backend/internal/models"
	"ongera_access_app_backend/internal/services"
)

type UserHandler struct {
	service *services.UserService
}

func NewUserHandler(service *services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// ListUsers godoc
// @Summary      List users
// @Description  Returns all registered users (requires authentication)
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   models.User
// @Failure      401  {object}  models.ErrorResponse
// @Failure      403  {object}  models.ErrorResponse
// @Failure      500  {object}  models.ErrorResponse
// @Router       /api/v1/users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
	users, err := h.service.ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "failed to list users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// Login godoc
// @Summary      Authenticate user
// @Description  Validates credentials and returns a JWT
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request  body      models.LoginRequest  true  "Login credentials"
// @Success      200      {object}  models.LoginResponse
// @Failure      400      {object}  models.ErrorResponse
// @Failure      401      {object}  models.ErrorResponse
// @Router       /api/v1/auth/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "login failed"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// CreateUser godoc
// @Summary      Create user
// @Description  Registers a new user account
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body      models.CreateUserRequest  true  "New user"
// @Success      201      {object}  models.User
// @Failure      400      {object}  models.ErrorResponse
// @Failure      401      {object}  models.ErrorResponse
// @Failure      403      {object}  models.ErrorResponse
// @Failure      409      {object}  models.ErrorResponse
// @Router       /api/v1/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	user, err := h.service.CreateUser(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, services.ErrUserExists) {
			c.JSON(http.StatusConflict, models.ErrorResponse{Error: "user already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}
