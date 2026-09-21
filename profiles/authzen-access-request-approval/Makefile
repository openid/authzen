.DEFAULT_GOAL := all

# Explicit sources exclude working copies and editorial documents.
SOURCES ?= authzen-access-request-approval-profile-1_0.md \
	authzen-access-request-catalog-profile-1_0.md \
	authzen-access-request-bulk-profile-1_0.md \
	authzen-access-request-callback-profile-1_0.md \
	authzen-access-request-actor-profile-1_0.md
XML = $(SOURCES:.md=.xml)
HTML = $(SOURCES:.md=.html)
TEXT = $(SOURCES:.md=.txt)

.PHONY: all xml html text
.DELETE_ON_ERROR:
.SECONDARY: $(XML)

all: xml html text
xml: $(XML)
html: $(HTML)
text: $(TEXT)

%.xml: %.md
	kramdown-rfc2629 $< > $@

%.html: %.xml
	xml2rfc --html $< -o $@

%.txt: %.xml
	xml2rfc --text $< -o $@
