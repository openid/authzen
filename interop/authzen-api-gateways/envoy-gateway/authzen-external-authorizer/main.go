package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	auth_pb "github.com/envoyproxy/go-control-plane/envoy/service/auth/v3"
	"github.com/getkin/kin-openapi/openapi3"
	"google.golang.org/grpc"
)

type AuthServer struct {
	httpClient  *http.Client
	openApiSpec openapi3.T
}

func (server *AuthServer) Check(ctx context.Context, request *auth_pb.CheckRequest) (*auth_pb.CheckResponse, error) {
	// Skip /pdps and OPTIONS requests
	if request.Attributes.Request.Http.Path == "/pdps" || request.Attributes.Request.Http.Method == "OPTIONS" {
		return &auth_pb.CheckResponse{
			HttpResponse: &auth_pb.CheckResponse_OkResponse{
				OkResponse: &auth_pb.OkHttpResponse{},
			},
		}, nil
	}

	response, err := server.AuthorizeRequest(ctx, request)
	if err != nil {
		return nil, err
	}

	if response {
		return &auth_pb.CheckResponse{}, nil
	} else {
		return nil, fmt.Errorf("Not allowed")
	}
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
			Timeout: time.Second,
		},
		openApiSpec: openApiSpec,
	}
	auth_pb.RegisterAuthorizationServer(s, server)

	defer s.Stop()
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v\n", err)
	}
}
