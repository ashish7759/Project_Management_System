from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from collections import defaultdict
import time

class RateLimitMiddleware(BaseHTTPMiddleware):
    requests = defaultdict(list)

    def __init__(self, app, max_requests: int = 5, window_seconds: int = 300):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds


    async def dispatch(self, request: Request, call_next):
        # Only rate limit login endpoint
        if request.url.path == "/api/v1/auth/login":
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            window_start = now - self.window_seconds

            # Remove old requests outside the window
            self.requests[client_ip] = [
                t for t in self.requests[client_ip] if t > window_start
            ]

            if len(self.requests[client_ip]) >= self.max_requests:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "message": "Too many login attempts. Please try again after 5 minutes."
                    }
                )
            self.requests[client_ip].append(now)

        response = await call_next(request)
        return response

