
dev:
	go install
	cd ~/Entwicklung/mono && nx run website:serve 2>&1 | uitail --web=false

build:
	cd ../frontend && pnpm build && cp -r dist ../cli/internal/static/dist
	cd ../cli
	go build

