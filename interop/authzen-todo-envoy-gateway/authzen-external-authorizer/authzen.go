package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	auth_pb "github.com/envoyproxy/go-control-plane/envoy/service/auth/v3"
	"github.com/golang-jwt/jwt/v5"
)

var pdps = map[string]string{
	"Aserto": "http://authzen-gateway-proxy.demo.aserto.com",
	"Cerbos": "https://authzen-proxy-demo.cerbos.dev",
}

type AuthZENSubject struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

type AuthZENAction struct {
	Name string `json:"name"`
}

type AuthZENResource struct {
	Type       string         `json:"type"`
	ID         string         `json:"id"`
	Properties map[string]any `json:"properties"`
}

type AuthZENRequest struct {
	Subject  AuthZENSubject  `json:"subject"`
	Action   AuthZENAction   `json:"action"`
	Resource AuthZENResource `json:"resource"`
	Context  map[string]any  `json:"context"`
}

type AuthZENResponse struct {
	Decision bool `json:"decision"`
}

func (server *AuthServer) AuthorizeRequest(ctx context.Context, request *auth_pb.CheckRequest) (bool, error) {

	pdpUrl := pdps[request.Attributes.Request.Http.Headers["X_AUTHZEN_GATEWAY_PDP"]]

	userId, err := extractSubFromBearer(request.Attributes.Request.Http.Headers["authorization"])
	if err != nil {
		log.Printf("Failed to extract user ID: %v\n", err)
		return false, err
	}

	url := fmt.Sprint(request.Attributes.Request.Http.Scheme, "://", request.Attributes.Request.Http.Host, request.Attributes.Request.Http.Path)

	route, params, err := MatchURLToPath(server.openApiSpec, url)
	if err != nil {
		log.Printf("Failed to match URL to path: %v\n", err)
	}

	authZENPayload := &AuthZENRequest{
		Subject: AuthZENSubject{
			Type: "user",
			ID:   userId,
		},
		Action: AuthZENAction{
			Name: request.Attributes.Request.Http.Method,
		},
		Resource: AuthZENResource{
			Type: "route",
			ID:   route,
			Properties: map[string]any{
				"uri":      fmt.Sprint(request.Attributes.Request.Http.Scheme, "://", request.Attributes.Request.Http.Host, request.Attributes.Request.Http.Path),
				"schema":   request.Attributes.Request.Http.Scheme,
				"hostname": request.Attributes.Request.Http.Host,
				"path":     request.Attributes.Request.Http.Path,
				"params":   params,
				"ip":       request.Attributes.Request.Http.Headers["x-forwarded-for"],
			},
		},
		Context: map[string]any{},
	}

	log.Println("Sending request to PDP")
	log.Printf("%+v\n", authZENPayload)

	payloadBuf := new(bytes.Buffer)
	json.NewEncoder(payloadBuf).Encode(authZENPayload)
	req, _ := http.NewRequestWithContext(ctx, "POST", fmt.Sprint(pdpUrl, "/access/v1/evaluation"), payloadBuf)

	req.Header.Set("Content-Type", "application/json")

	res, e := server.httpClient.Do(req)
	if e != nil {
		return false, e
	}

	defer res.Body.Close()

	var authZENResponse AuthZENResponse
	err = json.NewDecoder(res.Body).Decode(&authZENResponse)
	if err != nil {
		return false, err
	}

	log.Println("PDP response")
	log.Printf("%+v\n", authZENResponse)

	return authZENResponse.Decision, nil

}

func extractSubFromBearer(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("authorization header missing")
	}

	// Check if it's a Bearer token
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", fmt.Errorf("invalid authorization header format")
	}

	tokenString := parts[1]

	// Parse the JWT token without validation
	parser := jwt.NewParser()
	token, _, err := parser.ParseUnverified(tokenString, jwt.MapClaims{})
	if err != nil {
		return "", fmt.Errorf("failed to parse token: %v", err)
	}

	// Extract claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if sub, ok := claims["sub"].(string); ok {
			return sub, nil
		}
		return "", fmt.Errorf("subject claim (sub) missing in token")
	}

	return "", fmt.Errorf("invalid token claims")
}
