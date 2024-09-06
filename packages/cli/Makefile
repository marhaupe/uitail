dev: 
	go run main.go "node testlogger.js"

ui:
	rm -rf internal/static/dist
	cd ../frontend && pnpm build && cp -r dist ../cli/internal/static/dist

build: ui
	go build

install: ui
	go install
