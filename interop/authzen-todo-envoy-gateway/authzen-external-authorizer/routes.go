package main

import (
	"fmt"
	"log"
	"regexp"

	auth_pb "github.com/envoyproxy/go-control-plane/envoy/service/auth/v3"
)

var patterns = map[*regexp.Regexp]string{
	regexp.MustCompile(`/users$`):                    "/users",
	regexp.MustCompile(`/users/([a-zA-Z0-9_@.-]+)$`): "/users/{id}",
	regexp.MustCompile(`/todos$`):                    "/todos",
	regexp.MustCompile(`/todos/([a-zA-Z0-9_-]+)$`):   "/todos/{id}",
}

func MatchRoute(request *auth_pb.CheckRequest) (*AuthZENResource, error) {
	var route string
	var matches map[string]string
	for pattern, replacement := range patterns {
		if pattern.MatchString(request.Attributes.Request.Http.Path) {
			route = replacement
			matches = make(map[string]string)
			groups := pattern.FindStringSubmatch(request.Attributes.Request.Http.Path)
			if len(groups) > 1 {
				// Extract the placeholder names from the replacement string
				placeholders := regexp.MustCompile(`\{([^}]+)\}`).FindAllStringSubmatch(replacement, -1)
				for i, placeholder := range placeholders {
					matches[placeholder[1]] = groups[i+1]
				}
			}
			break
		}
	}

	if route == "" {
		log.Printf("%s route not found\n", request.Attributes.Request.Http.Path)
		return nil, fmt.Errorf("route not found")
	}
	return &AuthZENResource{
		Type: "route",
		ID:   route,
		Properties: map[string]any{
			"uri":      fmt.Sprint(request.Attributes.Request.Http.Scheme, "://", request.Attributes.Request.Http.Host, request.Attributes.Request.Http.Path),
			"schema":   request.Attributes.Request.Http.Scheme,
			"hostname": request.Attributes.Request.Http.Host,
			"path":     request.Attributes.Request.Http.Path,
			"params":   matches,
			"ip":       request.Attributes.Request.Http.Headers["x-forwarded-for"],
		},
	}, nil
}
