package events

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

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
}

type Log struct {
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func New() *EventService {
	service := &EventService{
		sseServer: sse.New(),
		logs:      make([]Log, 0),
		sessions:  sync.Map{},
	}
	service.setup()
	return service
}

func (s *EventService) Handler() iris.Handler {
	return func(ctx iris.Context) {
		s.sseServer.ServeHTTP(ctx.ResponseWriter(), ctx.Request())
	}
}

func (s *EventService) setup() {
	s.sseServer.AutoReplay = false
	s.sseServer.AutoStream = true
	s.sseServer.OnSubscribe = func(streamID string, sub *sse.Subscriber) {
		filter := sub.URL.Query().Get("filter")
		s.sessions.Store(streamID, Session{
			streamID: streamID,
			filter:   filter,
		})
		err := s.Replay(streamID)
		if err != nil {
			log.Printf("error replaying logs for new stream: %s\n", err)
		}
	}
	s.sseServer.OnUnsubscribe = func(streamID string, sub *sse.Subscriber) {
		s.sessions.Delete(streamID)
	}
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
	if len(session.filter) > 0 && !strings.Contains(l.Message, session.filter) {
		return false
	}
	return true
}
