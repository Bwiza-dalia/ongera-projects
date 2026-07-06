// Package config loads application settings from .env.
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App struct {
		Name string
		Port int
		Env  string
	}
	Database struct {
		Host     string
		Port     int
		User     string
		Password string
		DBName   string
		SSLMode  string
	}
	JWT struct {
		Secret string
		Expiry time.Duration
		Issuer string
	}
	LogLevel  string
	LogFormat string
}

func (c *Config) ServerAddr() string {
	return fmt.Sprintf(":%d", c.App.Port)
}

func (c *Config) PostgresDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.DBName,
		c.Database.SSLMode,
	)
}

func Load() (*Config, error) {
	_ = godotenv.Load(".env")

	expiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		return nil, fmt.Errorf("parse JWT_EXPIRY: %w", err)
	}

	port, err := strconv.Atoi(getEnv("APP_PORT", "8080"))
	if err != nil {
		return nil, fmt.Errorf("parse APP_PORT: %w", err)
	}

	dbPort, err := strconv.Atoi(getEnv("DB_PORT", "5432"))
	if err != nil {
		return nil, fmt.Errorf("parse DB_PORT: %w", err)
	}

	cfg := &Config{
		LogLevel:  getEnv("LOG_LEVEL", "info"),
		LogFormat: getEnv("LOG_FORMAT", "text"),
	}
	cfg.App.Name = getEnv("APP_NAME", "Ongera Access App Backend")
	cfg.App.Port = port
	cfg.App.Env = getEnv("APP_ENV", "debug")
	cfg.Database.Host = getEnv("DB_HOST", "localhost")
	cfg.Database.Port = dbPort
	cfg.Database.User = getEnv("DB_USER", "postgres")
	cfg.Database.Password = getEnv("DB_PASSWORD", "postgres")
	cfg.Database.DBName = getEnv("DB_NAME", "ongera")
	cfg.Database.SSLMode = getEnv("DB_SSLMODE", "disable")
	cfg.JWT.Secret = getEnv("JWT_SECRET", "change-me")
	cfg.JWT.Expiry = expiry
	cfg.JWT.Issuer = getEnv("JWT_ISSUER", "ongera-access-app")

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
