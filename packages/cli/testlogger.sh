#!/bin/bash

print() {
	printf '%s\n' "$1"
	sleep 0.1
}


generate_timestamp() {
	date "+%Y-%m-%d %H:%M:%S.%3N"
}

print "🚀 Starting application..."
while true; do
	timestamp=$(generate_timestamp)
	
	print "[${timestamp}] INFO  com.example.Application - Application started successfully"
	print "[${timestamp}] DEBUG com.example.UserService - User authentication attempt: user123"
	print "[${timestamp}] INFO  com.example.UserService - User user123 logged in successfully"
	
	print "[${timestamp}] DEBUG com.example.DataProcessor - Processing large dataset: "
	for i in {1..10}; do
		print "."
		sleep 0.1
	done
	print " Done"
	
	print "[${timestamp}] WARN  com.example.CacheManager - Cache hit ratio below threshold: 65%"
	
	print "$(cat << EOF
[${timestamp}] ERROR com.example.PaymentService - Failed to process payment for order #12345
java.lang.IllegalStateException: Invalid payment state
    at com.example.PaymentService.processPayment(PaymentService.java:127)
    at com.example.OrderController.confirmOrder(OrderController.java:89)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(NativeMethodAccessorImpl.java:62)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.base/java.lang.reflect.Method.invoke(Method.java:566)
    at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:190)
    at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:138)
    at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:105)
    at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:879)
EOF
)"
	
	print "[${timestamp}] INFO  com.example.MetricsCollector - Current system metrics: CPU: 78%, Memory: 4.2GB/8GB, Disk I/O: 250MB/s"
	
	print "[${timestamp}] DEBUG com.example.DatabaseConnection - Executing SQL query: SELECT * FROM users WHERE last_login > '2023-01-01' LIMIT 1000"
	
	sleep 5
done
