package logs

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/acarl005/stripansi"
	"github.com/google/uuid"
	"github.com/kataras/iris/v12"
	"github.com/patrickmn/go-cache"
	"github.com/r3labs/sse/v2"
)

type LogService struct {
	logs      []Log
	sessions  *cache.Cache
	sseServer *sse.Server
	io.Writer
}

type Session struct {
	streamID      string
	query         string
	caseSensitive bool
	after         string
}

type Log struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func New() *LogService {
	s := &LogService{
		sseServer: sse.New(),
		logs:      make([]Log, 0),
		sessions:  cache.New(cache.NoExpiration, cache.NoExpiration),
	}
	s.sseServer.AutoReplay = false
	s.sseServer.AutoStream = true
	s.sseServer.OnSubscribe = func(streamID string, sub *sse.Subscriber) {
		query := sub.URL.Query().Get("query")
		caseSensitive := sub.URL.Query().Get("caseSensitive") == "true"
		after := sub.URL.Query().Get("after")
		s.sessions.Set(streamID, Session{
			streamID:      streamID,
			query:         query,
			after:         after,
			caseSensitive: caseSensitive,
		}, cache.NoExpiration)
		err := s.replay(streamID)
		if err != nil {
			fmt.Printf("Error replaying logs for new stream: %s\n", err)
		}
	}
	s.sseServer.OnUnsubscribe = func(streamID string, sub *sse.Subscriber) {
		s.sessions.Delete(streamID)
	}
	return s
}

func (s *LogService) EventHandler() iris.Handler {
	return func(ctx iris.Context) {
		s.sseServer.ServeHTTP(ctx.ResponseWriter(), ctx.Request())
	}
}

func (s *LogService) ClearHandler() iris.Handler {
	return func(ctx iris.Context) {
		s.logs = make([]Log, 0)
		for key, entry := range s.sessions.Items() {
			session, ok := entry.Object.(Session)
			if ok && session.after != "" {
				session.after = ""
				s.sessions.Set(key, session, cache.NoExpiration)
			}
			s.replay(key)
		}
		ctx.StatusCode(iris.StatusOK)
		ctx.WriteString("OK")
	}
}

func (s *LogService) Write(p []byte) (n int, err error) {
	msg := strings.TrimRight(string(p), "\n")
	msg = stripansi.Strip(msg)
	l := Log{
		ID:        uuid.New().String(),
		Timestamp: time.Now().UTC(),
		Message:   msg,
	}
	s.Publish(l)
	return len(p), nil
}

func (s *LogService) Publish(l Log) error {
	s.logs = append(s.logs, l)
	data, err := json.Marshal([]Log{l})
	if err != nil {
		return fmt.Errorf("error marshalling log: %s", err)
	}
	for _, entry := range s.sessions.Items() {
		session, ok := entry.Object.(Session)
		if !ok || !matchFilter(session, l) {
			continue
		}
		s.sseServer.Publish(session.streamID, &sse.Event{
			Data: data,
		})
	}

	return nil
}

func (s *LogService) replay(token string) error {
	if !s.sseServer.StreamExists(token) {
		return fmt.Errorf("stream does not exist")
	}
	storedSession, ok := s.sessions.Get(token)
	if !ok {
		return fmt.Errorf("session does not exist")
	}
	session, ok := storedSession.(Session)
	if !ok {
		return fmt.Errorf("session is not of type session")
	}
	processedLogs := make([]Log, 0)
	for _, l := range s.logs {
		if session.after != "" && l.ID == session.after {
			processedLogs = make([]Log, 0)
			continue
		}
		if matchFilter(session, l) {
			processedLogs = append(processedLogs, l)
		}

	}
	data, err := json.Marshal(processedLogs)
	if err != nil {
		return fmt.Errorf("error marshalling logs: %s", err)
	}
	s.sseServer.Publish(token, &sse.Event{
		Data: data,
	})
	return nil
}

func matchFilter(session Session, l Log) bool {
	if len(session.query) > 0 {
		if session.caseSensitive {
			return strings.Contains(l.Message, session.query)
		}
		return strings.Contains(strings.ToLower(l.Message), strings.ToLower(session.query))
	}
	return true
}
