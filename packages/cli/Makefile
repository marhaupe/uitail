dev: 
	go run main.go "sh testlogger.sh"

ui:
	rm -rf internal/static/dist
	cd ../frontend && pnpm build && cp -r dist ../cli/internal/static/dist

build: ui
	go build

install: ui
	go install
