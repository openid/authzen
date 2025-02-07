package main

import (
	"fmt"
	"net/url"
	"regexp"

	"github.com/getkin/kin-openapi/openapi3"
)

func MatchURLToPath(spec openapi3.T, incomingURL string) (string, map[string]string, error) {

	parsedURL, err := url.Parse(incomingURL)
	if err != nil {
		return "", nil, fmt.Errorf("invalid URL: %w", err)
	}

	// Iterate over OpenAPI paths
	for path := range spec.Paths.Map() {
		paramRegex, paramNames := convertOpenAPIPathToRegex(path)
		if paramRegex.MatchString(parsedURL.Path) {
			matches := paramRegex.FindStringSubmatch(parsedURL.Path)
			params := make(map[string]string)

			// Extract path parameters
			for i, name := range paramNames {
				params[name] = matches[i+1]
			}
			return path, params, nil
		}
	}

	return "", nil, fmt.Errorf("no matching path found")
}

// Convert OpenAPI path format to regex
func convertOpenAPIPathToRegex(path string) (*regexp.Regexp, []string) {
	var paramNames []string
	re := regexp.MustCompile(`\{([^}]+)\}`)

	regexStr := re.ReplaceAllStringFunc(path, func(match string) string {
		paramName := match[1 : len(match)-1]
		paramNames = append(paramNames, paramName)
		return `([^/]+)`
	})

	regexStr = "^" + regexStr + "$"
	return regexp.MustCompile(regexStr), paramNames
}
