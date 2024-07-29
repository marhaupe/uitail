package static

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed all:dist
var dist embed.FS

type Static struct {
	port             int
	eventServicePort int
}

func New(port, eventServicePort int) *Static {
	return &Static{
		port:             port,
		eventServicePort: eventServicePort,
	}
}

func (s *Static) Serve() {
	assets, _ := fs.Sub(dist, "dist")
	fs := http.FileServer(http.FS(assets))
	http.Handle("/", http.StripPrefix("/", fs))
	fmt.Printf("running uitail on http://localhost:%d\n", s.port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", s.port), nil)
	if err != nil {
		log.Fatal(err)
	}
}
