package events

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	"github.com/r3labs/sse/v2"
)

type EventService struct {
	logs      []Log
	sseServer *sse.Server
	sessions  sync.Map
}

type Session struct {
	streamID string
	filter   string
	after    *time.Time
	before   *time.Time
}

type Log struct {
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func New() *EventService {
	sseServer := sse.New()
	sseServer.AutoReplay = false
	sseServer.AutoStream = true

	return &EventService{
		sseServer: sseServer,
		logs:      make([]Log, 0),
		sessions:  sync.Map{},
	}
}

func (s *EventService) Start(ssePort int) {
	// todo: use iris also to host static files. we can get away with only occupying one port
	app := iris.New()

	crs := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowCredentials: true,
	})
	app.UseRouter(crs)

	app.Any("/events", iris.FromStd(func(w http.ResponseWriter, r *http.Request) {
		s.sseServer.ServeHTTP(w, r)
	}))

	s.sseServer.OnSubscribe = func(streamID string, sub *sse.Subscriber) {
		filter := sub.URL.Query().Get("filter")
		after := sub.URL.Query().Get("after")
		afterTime, err := time.Parse(time.RFC3339, after)
		afterTimeFilter := &afterTime
		if err != nil {
			afterTimeFilter = nil
		}

		before := sub.URL.Query().Get("before")
		beforeTime, err := time.Parse(time.RFC3339, before)
		beforeTimeFilter := &beforeTime
		if err != nil {
			beforeTimeFilter = nil
		}

		s.sessions.Store(streamID, Session{
			streamID: streamID,
			filter:   filter,
			after:    afterTimeFilter,
			before:   beforeTimeFilter,
		})
		err = s.Replay(streamID)
		if err != nil {
			log.Printf("error replaying logs for new stream: %s\n", err)
		}
	}
	s.sseServer.OnUnsubscribe = func(streamID string, sub *sse.Subscriber) {
		s.sessions.Delete(streamID)
	}

	log.Fatal(app.Listen(fmt.Sprintf(":%d", ssePort)))

}

func (s *EventService) Replay(token string) error {
	if !s.sseServer.StreamExists(token) {
		return fmt.Errorf("stream does not exist")
	}

	storedSession, ok := s.sessions.Load(token)
	if !ok {
		return fmt.Errorf("session does not exist")
	}
	session, ok := storedSession.(Session)
	if !ok {
		return fmt.Errorf("session is not of type Session")
	}

	filteredLogs := make([]Log, 0)
	for _, log := range s.logs {
		if matchFilter(session, log) {
			filteredLogs = append(filteredLogs, log)
		}
	}
	data, err := json.Marshal(filteredLogs)
	if err != nil {
		return fmt.Errorf("error marshalling logs: %s", err)
	}
	s.sseServer.Publish(token, &sse.Event{
		Data: data,
	})
	return nil
}

func (s *EventService) Publish(l Log) error {
	s.logs = append(s.logs, l)
	data, err := json.Marshal([]Log{l})
	if err != nil {
		return fmt.Errorf("error marshalling log: %s", err)
	}
	s.sessions.Range(func(key, sessionData interface{}) bool {
		session, ok := sessionData.(Session)
		if !ok || !matchFilter(session, l) {
			return true
		}
		s.sseServer.Publish(session.streamID, &sse.Event{
			Data: data,
		})
		return true
	})

	return nil
}

func matchFilter(session Session, l Log) bool {
	if session.after != nil && l.Timestamp.Before(*session.after) {
		return false
	}
	if session.before != nil && l.Timestamp.After(*session.before) {
		return false
	}
	if len(session.filter) > 0 && !strings.Contains(l.Message, session.filter) {
		return false
	}
	return true
}
