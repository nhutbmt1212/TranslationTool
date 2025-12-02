import React from 'react';

interface ProgressCircleProps {
  countdown: number;
  maxCountdown: number;
}

const CIRCLE_CIRCUMFERENCE = 62.83; // 2 * PI * radius (radius = 10)

const ProgressCircle: React.FC<ProgressCircleProps> = ({ countdown, maxCountdown }) => {
  const progress = countdown / maxCountdown;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="countdown-timer">
      <svg className="countdown-circle" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="10"
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s linear',
          }}
        />
      </svg>
      <span className="countdown-text">{countdown}s</span>
    </div>
  );
};

export default ProgressCircle;
