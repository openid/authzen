package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	auth_pb "github.com/envoyproxy/go-control-plane/envoy/service/auth/v3"
	"google.golang.org/grpc"
)

type AuthServer struct {
	httpClient *http.Client
	pdpURL     string
	pdpAuthN   string
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

	pdpURL := os.Getenv("PDP_URL")
	if pdpURL == "" {
		log.Fatalf("PDP_URL is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatalf("PORT is required")
	}

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	lis, err := net.Listen("tcp", addr)

	if err != nil {
		log.Fatalf("failed to listen: %v\n", err)
	}

	defer func(lis net.Listener) {
		if err := lis.Close(); err != nil {
			log.Fatalf("unexpected error: %v", err)
		}
	}(lis)
	log.Printf("listening at %s\n", addr)

	var opts []grpc.ServerOption
	s := grpc.NewServer(opts...)

	server := &AuthServer{
		httpClient: &http.Client{
			Timeout: time.Second,
		},
		pdpURL:   pdpURL,
		pdpAuthN: os.Getenv("PDP_AUTHN"),
	}
	auth_pb.RegisterAuthorizationServer(s, server)

	defer s.Stop()
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v\n", err)
	}
}
