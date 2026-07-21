from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class RateLimitStatus:
    allowed: bool
    remaining: int
    retry_after_seconds: int


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, deque[float]] = {}

    def check(self, key: str, limit: int, window_seconds: int) -> RateLimitStatus:
        now = time.time()
        cutoff = now - window_seconds
        entries = self._requests.setdefault(key, deque())

        while entries and entries[0] <= cutoff:
            entries.popleft()

        if len(entries) >= limit:
            retry_after_seconds = max(1, int(entries[0] + window_seconds - now))
            return RateLimitStatus(
                allowed=False,
                remaining=0,
                retry_after_seconds=retry_after_seconds,
            )

        entries.append(now)
        return RateLimitStatus(
            allowed=True,
            remaining=max(0, limit - len(entries)),
            retry_after_seconds=0,
        )
