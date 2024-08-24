dev: install
	node testlogger.js 2>&1 | go run main.go

ui:
	rm -rf internal/static/dist
	cd ../frontend && pnpm build && cp -r dist ../cli/internal/static/dist

build: ui
	go build

install: ui
	go install
