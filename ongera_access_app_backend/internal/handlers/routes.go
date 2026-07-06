// Package handlers contains sample HTTP handlers and route registration.
// Real endpoints (prescriptions, sessions, reports) will be added here later.
package handlers

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"ongera_access_app_backend/internal/auth"
	"ongera_access_app_backend/internal/middleware"
	"ongera_access_app_backend/internal/models"
)

type Routes struct {
	Health *HealthHandler
	User   *UserHandler
	Auth   *auth.Service
}

func RegisterRoutes(router *gin.Engine, routes Routes) {
	router.GET("/health", routes.Health.Health)
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := router.Group("/api/v1")
	v1.POST("/auth/login", routes.User.Login)

	protected := v1.Group("")
	protected.Use(middleware.Auth(routes.Auth))
	{
		admin := protected.Group("")
		admin.Use(middleware.RequireRole(models.RoleAdmin))
		admin.GET("/users", routes.User.ListUsers)
		admin.POST("/users", routes.User.CreateUser)
	}
}
