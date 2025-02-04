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

type MatchedRoute struct {
	route  string
	params map[string]string
}

func MatchRoute(request *auth_pb.CheckRequest) (*MatchedRoute, error) {
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

	return &MatchedRoute{
		route:  route,
		params: matches,
	}, nil
}
