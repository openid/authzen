package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	auth_pb "github.com/envoyproxy/go-control-plane/envoy/service/auth/v3"
	envoy_type "github.com/envoyproxy/go-control-plane/envoy/type/v3"

	"github.com/getkin/kin-openapi/openapi3"
	"google.golang.org/genproto/googleapis/rpc/status"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
)

type AuthServer struct {
	httpClient     *http.Client
	openApiSpec    openapi3.T
	pdpAuthConfigs map[string]PDPAuthConfig
}

// PDPAuthConfig stores authentication configuration for PDPs
type PDPAuthConfig struct {
	Token string `json:"token"`
}

func denied(code int32, body string) *auth_pb.CheckResponse {
	return &auth_pb.CheckResponse{
		Status: &status.Status{Code: code},
		HttpResponse: &auth_pb.CheckResponse_DeniedResponse{
			DeniedResponse: &auth_pb.DeniedHttpResponse{
				Status: &envoy_type.HttpStatus{
					Code: envoy_type.StatusCode(code),
				},
				Body: body,
			},
		},
	}
}

func allowed() *auth_pb.CheckResponse {
	return &auth_pb.CheckResponse{
		Status: &status.Status{Code: int32(codes.OK)},
		HttpResponse: &auth_pb.CheckResponse_OkResponse{
			OkResponse: &auth_pb.OkHttpResponse{},
		},
	}
}

func (server *AuthServer) Check(ctx context.Context, request *auth_pb.CheckRequest) (*auth_pb.CheckResponse, error) {

	// Skip authorization for /pdps and OPTIONS
	if request.Attributes.Request.Http.Path == "/pdps" || request.Attributes.Request.Http.Method == "OPTIONS" {
		return allowed(), nil
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	response, err := server.AuthorizeRequest(ctx, request)
	if err != nil {
		log.Printf("Authorization error: %v\n", err)
		return denied(http.StatusUnauthorized, "unauthorized"), nil
	}
	log.Printf("Response: %v\n", response)

	if !response {
		return denied(http.StatusUnauthorized, "unauthorized"), nil
	}

	return allowed(), nil
}

func main() {

	// Load OpenAPI specification from file
	fileData, err := os.ReadFile("openapi.json")
	if err != nil {
		log.Fatalf("failed to read OpenAPI spec file: %v", err)
	}

	// Parse OpenAPI specification
	var openApiSpec openapi3.T
	if err := json.Unmarshal(fileData, &openApiSpec); err != nil {
		log.Fatalf("failed to parse OpenAPI JSON: %v", err)
	}

	var pdpAuthConfigs map[string]PDPAuthConfig

	if authConfigB64 := os.Getenv("AUTHZEN_PDP_AUTH_CONFIG"); authConfigB64 != "" {
		authConfigJSON, err := base64.StdEncoding.DecodeString(authConfigB64)
		if err != nil {
			log.Printf("Warning: Failed to decode PDP auth config: %v", err)
			return
		}

		if err := json.Unmarshal(authConfigJSON, &pdpAuthConfigs); err != nil {
			log.Printf("Warning: Failed to parse PDP auth config: %v", err)
			return
		}
	}

	lis, err := net.Listen("tcp", "0.0.0.0:3001")

	if err != nil {
		log.Fatalf("failed to listen: %v\n", err)
	}

	defer func(lis net.Listener) {
		if err := lis.Close(); err != nil {
			log.Fatalf("unexpected error: %v", err)
		}
	}(lis)
	log.Printf("listening at %s\n", "0.0.0.0:3001")

	var opts []grpc.ServerOption
	s := grpc.NewServer(opts...)

	server := &AuthServer{
		httpClient: &http.Client{
			Timeout: time.Second * 10,
		},
		openApiSpec:    openApiSpec,
		pdpAuthConfigs: pdpAuthConfigs,
	}
	auth_pb.RegisterAuthorizationServer(s, server)

	defer s.Stop()
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v\n", err)
	}
}
