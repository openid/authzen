OPEN=$(word 1, $(wildcard /usr/bin/xdg-open /usr/bin/open /bin/echo))
SOURCES?=${wildcard *.xml */*.xml}
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
	@ $(MAKE) authzen-mcp-profile-1_0.xml
	@ $(MAKE) authzen-mcp-profile-1_0.html
	@ $(MAKE) authzen-mcp-profile-1_0.txt
	@ $(MAKE) authzen-access-request-approval/authzen-access-request-approval-profile-1_0.xml
	@ $(MAKE) authzen-access-request-approval/authzen-access-request-approval-profile-1_0.html
	@ $(MAKE) authzen-access-request-approval/authzen-access-request-approval-profile-1_0.txt

