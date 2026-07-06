// Sample application entrypoint. Wires config, database, and routes together.
// Replace sample handlers/services as real Ongera Access features are built.
package main

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"

	"ongera_access_app_backend/internal/auth"
	"ongera_access_app_backend/internal/config"
	"ongera_access_app_backend/internal/database"
	"ongera_access_app_backend/internal/handlers"
	"ongera_access_app_backend/internal/logger"
	"ongera_access_app_backend/internal/middleware"
	"ongera_access_app_backend/internal/repository"
	"ongera_access_app_backend/internal/services"

	_ "ongera_access_app_backend/docs"
)

// @title           Ongera Access API
// @version         1.0
// @description     Ongera Access backend API (sample scaffold — not final implementation)
// @host            localhost:8080
// @BasePath        /
// @securityDefinitions.apikey BearerAuth
// @in              header
// @name            Authorization
func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("load config", "error", err)
		os.Exit(1)
	}

	log := logger.New(cfg)
	slog.SetDefault(log)
	gin.SetMode(cfg.App.Env)

	pool, err := database.NewPool(cfg)
	if err != nil {
		log.Error("connect database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	authService := auth.NewService(cfg)
	userService := services.NewUserService(repository.NewUserRepository(pool), authService)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.RequestLogger(log))

	handlers.RegisterRoutes(router, handlers.Routes{
		Health: handlers.NewHealthHandler(pool),
		User:   handlers.NewUserHandler(userService),
		Auth:   authService,
	})

	log.Info("server starting", "addr", cfg.ServerAddr())
	if err := router.Run(cfg.ServerAddr()); err != nil {
		log.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
