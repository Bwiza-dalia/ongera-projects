package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"ongera_access_app_backend/internal/database"
	"ongera_access_app_backend/internal/models"
)

type HealthHandler struct {
	pool *pgxpool.Pool
}

func NewHealthHandler(pool *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{pool: pool}
}

// Health godoc
// @Summary      Health check
// @Description  Returns service and database health status
// @Tags         health
// @Produce      json
// @Success      200  {object}  models.HealthResponse
// @Router       /health [get]
func (h *HealthHandler) Health(c *gin.Context) {
	resp := models.HealthResponse{Status: "ok", Database: "up"}
	if err := database.Ping(c.Request.Context(), h.pool); err != nil {
		resp.Status = "degraded"
		resp.Database = "down"
	}

	status := http.StatusOK
	if resp.Database == "down" {
		status = http.StatusServiceUnavailable
	}
	c.JSON(status, resp)
}
