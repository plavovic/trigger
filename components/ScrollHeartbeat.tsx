"use client";

const heartbeatPoints = "0,12 72,12 84,12 94,4 103,20 113,12 260,12";

export function ScrollHeartbeat() {
  return (
    <div className="footer-heartbeat" aria-hidden="true">
      <svg viewBox="0 0 260 24" role="presentation">
        <defs>
          <linearGradient id="heartbeat-gradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#ff3d00" />
          </linearGradient>
        </defs>
        <polyline className="heartbeat-base" points={heartbeatPoints} />
        <polyline className="heartbeat-progress" points={heartbeatPoints} />
      </svg>
    </div>
  );
}