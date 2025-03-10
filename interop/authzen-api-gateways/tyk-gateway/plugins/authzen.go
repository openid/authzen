package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"os"
	"strings"
	"time"

	"github.com/TykTechnologies/tyk/apidef/oas"
	"github.com/TykTechnologies/tyk/ctx"
	"github.com/TykTechnologies/tyk/log"
	"github.com/TykTechnologies/tyk/regexp"
	"github.com/dgrijalva/jwt-go"
	kin "github.com/getkin/kin-openapi/openapi3"
)

type PDPCredentials map[string]string

var (
	logger = log.Get()
	pdps   = map[string]string{
		"Aserto":               "https://authzen-gateway-proxy.demo.aserto.com",
		"Axiomatics":           "https://pdp.alfa.guide",
		"Cerbos":               "https://authzen-proxy-demo.cerbos.dev",
		"HexaOPA":              "https://interop.authzen.hexaorchestration.org",
		"OpenFGA":              "https://authzen-interop.openfga.dev/stores/01JNW1803442023HVDKV03FB3A",
		"PingAuthorize":        "https://authzen.idpartners.au",
		"PlainID":              "https://authzeninteropt.se-plainid.com",
		"Rock Solid Knowledge": "https://authzen.identityserver.com",
		"SGNL":                 "https://authzen.sgnlapis.cloud",
		"Topaz":                "https://authzen-topaz.demo.aserto.com",
	}
	creds PDPCredentials
)

func init() {
	logger.Info("--- Go AuthZEN plugin init success! ---- ")
	creds = loadPDPAPIKeys()
}

func loadPDPAPIKeys() map[string]string {
	apiKeys := make(map[string]string)
	encodedKeys := os.Getenv("AUTHZEN_PDP_API_KEYS")
	if encodedKeys == "" {
		logger.Warn("AUTHZEN_PDP_API_KEYS environment variable not set")
		return apiKeys
	}

	decodedKeys, err := base64.StdEncoding.DecodeString(encodedKeys)
	if err != nil {
		logger.Error("Failed to decode AUTHZEN_PDP_API_KEYS:", err)
		return apiKeys
	}

	var pdpCreds PDPCredentials
	if err := json.Unmarshal(decodedKeys, &pdpCreds); err != nil {
		logger.Error("Failed to decode JSON from AUTHZEN_PDP_API_KEYS:", err)
		return apiKeys
	}
	return pdpCreds
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
	Type       string          `json:"type"`
	ID         string          `json:"id"`
	Properties *map[string]any `json:"properties,omitempty"`
}

// AuthZENRequest represents the authorization request payload
type AuthZENRequest struct {
	Subject  AuthZENSubject  `json:"subject"`
	Action   AuthZENAction   `json:"action"`
	Resource AuthZENResource `json:"resource"`
	Context  *map[string]any `json:"context,omitempty"`
}

type AuthZENResponse struct {
	Decision bool `json:"decision"`
}

func AuthZENMiddleware(w http.ResponseWriter, r *http.Request) {
	pdpName := r.Header.Get("x_authzen_gateway_pdp")
	pdpURL := pdps[pdpName]
	if pdpURL == "" {
		logger.Error("PDP URL not found in request headers")
		http.Error(w, "PDP not found", http.StatusForbidden)
		return
	}
	credential := creds[pdpName]

	userId, err := extractSubFromBearer(r.Header.Get("Authorization"))
	if err != nil {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	openAPIDefinition := ctx.GetOASDefinition(r)

	path, _ := matchPath(r, openAPIDefinition)
	//logger.Info("MatchedPath: ", path)
	if path == "" {
		logger.Warnf("Path not found in OpenAPI spec, defaulting to request path %s", r.URL.Path)
		path = r.URL.Path
	}

	authZENPayload := &AuthZENRequest{
		Subject: AuthZENSubject{
			Type: "identity",
			ID:   userId,
		},
		Action: AuthZENAction{
			Name: r.Method,
		},
		Resource: AuthZENResource{
			Type: "route",
			ID:   path,
		},
	}

	payloadBuf := new(bytes.Buffer)
	if err := json.NewEncoder(payloadBuf).Encode(authZENPayload); err != nil {
		logger.WithError(err).Error("Failed to encode payload")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	req, err := http.NewRequest(http.MethodPost, fmt.Sprint(pdpURL, "/access/v1/evaluation"), payloadBuf)
	if err != nil {
		logger.WithError(err).Error("Failed to create request")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if credential != "" {
		req.Header.Set("Authorization", credential)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		logger.WithError(err).Error("Failed to connect to PDP")
		http.Error(w, "Failed to connect to PDP", http.StatusBadGateway)
		return
	}
	defer res.Body.Close()

	raw, _ := httputil.DumpResponse(res, true)

	var authZENResponse AuthZENResponse
	if err := json.NewDecoder(res.Body).Decode(&authZENResponse); err != nil {
		logger.WithError(err).Error("Failed to decode response")
		http.Error(w, "Failed to decode response", http.StatusInternalServerError)
		return
	}

	if !authZENResponse.Decision {
		logger.Errorf("Access denied: %s", raw)

		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return
	}
}

func extractSubFromBearer(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("authorization header missing")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", fmt.Errorf("invalid authorization header format")
	}

	tokenString := parts[1]

	parser := jwt.Parser{}
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

// Matches the request path with OpenAPI paths
func matchPath(r *http.Request, spec *oas.OAS) (string, *kin.PathItem) {
	// Get the request method and URL path
	method := strings.ToUpper(r.Method)
	reqPath := r.URL.Path

	// Iterate over all paths in the OpenAPI spec
	for path, pathItem := range spec.Paths {
		regexPattern := regexp.MustCompile(`\{[^\}]+\}`)
		pattern := "^" + regexPattern.ReplaceAllStringFunc(path, func(param string) string {
			paramName := strings.Trim(param, "{}")
			return fmt.Sprintf("(?P<%s>[^/]+)", paramName)
		}) + "$"

		matched, _ := regexp.MatchString(pattern, reqPath)
		if matched {
			logger.Debugf("Matched Path: %s, Pattern: %s", path, pattern)
			// Check if the method is supported on this path
			switch method {
			case http.MethodGet:
				if pathItem.Get != nil {
					return path, pathItem
				}
			case http.MethodPost:
				if pathItem.Post != nil {
					return path, pathItem
				}
			case http.MethodPut:
				if pathItem.Put != nil {
					return path, pathItem
				}
			case http.MethodDelete:
				if pathItem.Delete != nil {
					return path, pathItem
				}
			case http.MethodPatch:
				if pathItem.Patch != nil {
					return path, pathItem
				}
			}
		} else {
			//logger.Info("Path does not match")
		}
	}
	return "", nil
}

func main() {}

// This will be run during Gateway startup
func init() {
	logger.Info("--- Go AuthZEN plugin init success! ---- ")
}
