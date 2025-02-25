.PHONY: all clean build

# Default target
all: build

# Build the plugin
build-dev:
	cd plugins && go build -trimpath -buildmode=plugin . && cd -

build:
	cd plugins && docker run --rm -v `pwd`:/plugin-source \
                             --platform=linux/amd64 \
                             --env GOARCH=amd64 \
                             --env GOOS=linux \
                             --env CGO_ENABLED=1 \
                             --env CC=clang \
                             tykio/tyk-plugin-compiler:v5.7.2 plugin.so && cd -

# Clean build artifacts
clean:
	cd plugins && rm -f *.so && cd -
