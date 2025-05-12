import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset timer when duration changes
    setTimeLeft(duration);
    setIsWarning(false);
  }, [duration]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          
          // Set warning state when less than 20% time left
          if (newTime <= duration * 0.2 && !isWarning) {
            setIsWarning(true);
          }
          
          // Time is up
          if (newTime <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            onTimeUp();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, duration, onTimeUp, isWarning]);

  // Calculate progress percentage
  const progressPercentage = Math.max(0, (timeLeft / duration) * 100);

  // Determine color based on time left
  const getProgressColor = () => {
    if (timeLeft <= duration * 0.2) return 'bg-red-500';
    if (timeLeft <= duration * 0.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center mb-2">
        <Clock 
          size={20} 
          className={`mr-2 ${isWarning ? 'text-red-500 animate-pulse' : 'text-gray-700 dark:text-gray-300'}`} 
        />
        <span 
          className={`font-mono text-xl font-medium ${
            isWarning ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-200 ease-linear`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default Timer;