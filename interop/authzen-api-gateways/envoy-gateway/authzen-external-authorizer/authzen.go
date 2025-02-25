package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	auth_pb "github.com/envoyproxy/go-control-plane/envoy/service/auth/v3"
	"github.com/golang-jwt/jwt/v5"
)

// PDP URLs
var pdps = map[string]string{
	"Aserto":               "https://authzen-gateway-proxy.demo.aserto.com",
	"Axiomatics":           "https://pdp.alfa.guide",
	"Cerbos":               "https://authzen-proxy-demo.cerbos.dev",
	"PlainID":              "https://authzeninteropt.se-plainid.com",
	"Rock Solid Knowledge": "https://authzen.identityserver.com",
	"Topaz":                "https://authzen-topaz.demo.aserto.com",
}

// AuthZENSubject represents the subject in the authorization request
type AuthZENSubject struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// AuthZENAction represents the action in the authorization request
type AuthZENAction struct {
	Name string `json:"name"`
}

// AuthZENResource represents the resource in the authorization request
type AuthZENResource struct {
	Type       string         `json:"type"`
	ID         string         `json:"id"`
	Properties map[string]any `json:"properties"`
}

// AuthZENRequest represents the authorization request payload
type AuthZENRequest struct {
	Subject  AuthZENSubject  `json:"subject"`
	Action   AuthZENAction   `json:"action"`
	Resource AuthZENResource `json:"resource"`
	Context  map[string]any  `json:"context"`
}

// AuthZENResponse represents the authorization response
type AuthZENResponse struct {
	Decision bool `json:"decision"`
}

// AuthorizeRequest handles the authorization request to the PDP
func (server *AuthServer) AuthorizeRequest(ctx context.Context, request *auth_pb.CheckRequest) (bool, error) {

	// Get PDP URL from request headers
	pdpUrl := pdps[request.Attributes.Request.Http.Headers["x_authzen_gateway_pdp"]]
	if pdpUrl == "" {
		return false, fmt.Errorf("PDP not found: %s", request.Attributes.Request.Http.Headers["x_authzen_gateway_pdp"])
	}
	log.Printf("Starting request to PDP: %s\n", pdpUrl)

	// Extract user ID from authorization header
	userId, err := extractSubFromBearer(request.Attributes.Request.Http.Headers["authorization"])
	if err != nil {
		log.Printf("Failed to extract user ID: %v\n", err)
		return false, err
	}

	// Construct URL from request attributes
	url := fmt.Sprint(request.Attributes.Request.Http.Scheme, "://", request.Attributes.Request.Http.Host, request.Attributes.Request.Http.Path)

	// Match URL to path in OpenAPI spec
	route, params, err := MatchURLToPath(server.openApiSpec, url)
	if err != nil {
		log.Printf("Failed to match URL to path: %v\n", err)
		return false, err
	}

	log.Printf("Route: %s\n", route)
	log.Printf("Params: %v\n", params)

	// Create authorization request payload
	authZENPayload := &AuthZENRequest{
		Subject: AuthZENSubject{
			Type: "identity",
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

	log.Printf("Sending request to %s", pdpUrl)

	// Encode payload to JSON
	payloadBuf := new(bytes.Buffer)
	if err := json.NewEncoder(payloadBuf).Encode(authZENPayload); err != nil {
		log.Printf("Failed to encode payload: %v\n", err)
		return false, err
	}
	log.Printf("Payload: %+v\n", authZENPayload)

	// Create HTTP request with context
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprint(pdpUrl, "/access/v1/evaluation"), payloadBuf)
	if err != nil {
		log.Printf("Failed to create request: %v\n", err)
		return false, err
	}
	req.Header.Set("Content-Type", "application/json")

	// Send HTTP request with better error handling
	startTime := time.Now()
	res, err := server.httpClient.Do(req)
	if err != nil {
		if ctxErr := ctx.Err(); ctxErr != nil {
			log.Printf("Context error during request: %v (request duration: %v)\n", ctxErr, time.Since(startTime))
			return false, fmt.Errorf("context error during request: %v", ctxErr)
		}
		log.Printf("Failed to send request to PDP: %v (request duration: %v)\n", err, time.Since(startTime))
		return false, fmt.Errorf("failed to send request to PDP: %v", err)
	}
	requestDuration := time.Since(startTime)
	log.Printf("Request duration: %v\n", requestDuration)

	if requestDuration > 5*time.Second {
		log.Printf("Warning: Request took longer than 5 seconds")
	}

	defer res.Body.Close()

	// Decode response with timeout
	var authZENResponse AuthZENResponse
	if err := json.NewDecoder(res.Body).Decode(&authZENResponse); err != nil {
		log.Printf("Failed to decode response: %v\n", err)
		return false, fmt.Errorf("failed to decode response: %v", err)
	}

	log.Printf("PDP response received and decoded in %v\n", time.Since(startTime))
	log.Printf("%+v\n", authZENResponse)

	return authZENResponse.Decision, nil
}

// extractSubFromBearer extracts the subject (sub) claim from the Bearer token
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
