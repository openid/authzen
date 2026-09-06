SOURCES ?= $(wildcard *.md)
HTML = $(SOURCES:.md=.html)
TEXT = $(SOURCES:.md=.txt)

all: html text
html: $(HTML)
text: $(TEXT)

%.html: %.xml
	xml2rfc --html $^

%.txt: %.xml
	xml2rfc $^

%.xml: %.md
	kramdown-rfc2629 > $@ $^

clean:
	rm -f *.xml *.txt *.html

.PHONY: all html text clean
