import time
import json
from typing import Dict, List
from starlette.types import ASGIApp, Receive, Send, Scope

class RateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        # In-memory store: IP -> list of timestamps of failed attempts
        self.attempts: Dict[str, List[float]] = {}

    def is_rate_limited(self, ip_address: str) -> bool:
        now = time.time()
        # Filter out timestamps older than the window
        if ip_address in self.attempts:
            self.attempts[ip_address] = [
                t for t in self.attempts[ip_address] 
                if now - t < self.window_seconds
            ]
        else:
            self.attempts[ip_address] = []

        # Check if limits exceeded
        if len(self.attempts[ip_address]) >= self.max_attempts:
            return True
        return False

    def log_failed_attempt(self, ip_address: str):
        now = time.time()
        if ip_address not in self.attempts:
            self.attempts[ip_address] = []
        self.attempts[ip_address].append(now)

    def reset_attempts(self, ip_address: str):
        if ip_address in self.attempts:
            self.attempts[ip_address] = []

login_limiter = RateLimiter(max_attempts=5, window_seconds=300)

class LoginRateLimitMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "")

        if method == "POST" and path.endswith("/auth/login"):
            client = scope.get("client")
            client_ip = client[0] if client else "unknown"

            if login_limiter.is_rate_limited(client_ip):
                response_content = {
                    "success": False,
                    "message": "Too many failed login attempts. Please try again after 5 minutes.",
                    "detail": "Too many failed login attempts. Please try again after 5 minutes.",
                    "errors": ["Rate limit exceeded"]
                }
                body = json.dumps(response_content).encode("utf-8")
                await send({
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        (b"content-type", b"application/json"),
                    ]
                })
                await send({
                    "type": "http.response.body",
                    "body": body,
                    "more_body": False
                })
                return

            status_code = None

            async def send_wrapper(message):
                nonlocal status_code
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                await send(message)

            await self.app(scope, receive, send_wrapper)

            if status_code is not None:
                if status_code == 200:
                    login_limiter.reset_attempts(client_ip)
                else:
                    login_limiter.log_failed_attempt(client_ip)
        else:
            await self.app(scope, receive, send)
