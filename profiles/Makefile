OPEN=$(word 1, $(wildcard /usr/bin/xdg-open /usr/bin/open /bin/echo))
SOURCES?=${wildcard *.xml}
TEXT=${SOURCES:.xml=.txt}
HTML=${SOURCES:.xml=.html}

text:	$(TEXT)
html:   $(HTML)

%.html: %.xml
	xml2rfc --html $^

%.txt:	%.xml
	xml2rfc $^

%.xml: %.md
	kramdown-rfc2629 > $@ $^

all:
	@ make authzen-mcp-profile-1_0.xml
	@ make authzen-mcp-profile-1_0.html
	@ make authzen-mcp-profile-1_0.txt

propose:
	@ cp authzen-mcp-profile-1_0.txt ../publication/sharedsignals/authzen-mcp-profile-1_0.txt
