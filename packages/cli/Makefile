
dev: install
	cd ~/Entwicklung/mono && nx run website:serve 2>&1 | uitail

ui:
	rm -rf internal/static/dist
	cd ../frontend && pnpm build && cp -r dist ../cli/internal/static/dist

build: ui
	go build

install: ui
	go install