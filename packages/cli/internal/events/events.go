package events

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/r3labs/sse/v2"
	"github.com/rs/cors"
)

type EventService struct {
	logs     []Log
	server   *sse.Server
	sessions map[string]Session
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
	server := sse.New()
	server.AutoReplay = false
	server.AutoStream = true
	return &EventService{
		server:   server,
		logs:     make([]Log, 0),
		sessions: make(map[string]Session),
	}
}

func (s *EventService) Start(port int) {
	mux := http.NewServeMux()
	s.server.OnSubscribe = func(streamID string, sub *sse.Subscriber) {
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

		s.sessions[streamID] = Session{
			streamID: streamID,
			filter:   filter,
			after:    afterTimeFilter,
			before:   beforeTimeFilter,
		}
		err = s.Replay(streamID)
		if err != nil {
			log.Printf("error replaying logs for new stream: %s\n", err)
		}
	}
	s.server.OnUnsubscribe = func(streamID string, sub *sse.Subscriber) {
		delete(s.sessions, streamID)
	}
	mux.HandleFunc("/events", s.server.ServeHTTP)
	c := cors.New(cors.Options{})
	handler := c.Handler(mux)
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), handler)
	if err != nil {
		log.Fatal(err)
	}
}

func (s *EventService) Replay(token string) error {
	if !s.server.StreamExists(token) {
		return fmt.Errorf("stream does not exist")
	}
	session, ok := s.sessions[token]
	if !ok {
		return fmt.Errorf("session does not exist")
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
	s.server.Publish(token, &sse.Event{
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
	for _, session := range s.sessions {
		if !matchFilter(session, l) {
			continue
		}
		s.server.Publish(session.streamID, &sse.Event{
			Data: data,
		})
	}
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
