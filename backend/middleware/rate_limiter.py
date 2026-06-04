import time
from typing import Dict, List
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        # In-memory store: IP -> list of timestamps
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

        # Log attempt
        self.attempts[ip_address].append(now)
        return False

login_limiter = RateLimiter(max_attempts=5, window_seconds=300)

class LoginRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We only rate limit POST to /api/v1/auth/login
        if request.method == "POST" and request.url.path.endswith("/auth/login"):
            client_ip = request.client.host if request.client else "unknown"
            
            if login_limiter.is_rate_limited(client_ip):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "success": False,
                        "message": "Too many login attempts. Please try again after 5 minutes.",
                        "errors": ["Rate limit exceeded"]
                    }
                )
                
        response = await call_next(request)
        return response
