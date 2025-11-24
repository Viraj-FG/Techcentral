import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface GreetingData {
  greeting: string;
  emoji: string;
  timeOfDay: TimeOfDay;
  color: string;
  message: string;
}

export const useTimeBasedGreeting = (userName?: string): GreetingData => {
  const [greetingData, setGreetingData] = useState<GreetingData>(() => 
    getGreetingData(userName)
  );

  useEffect(() => {
    // Update greeting every minute
    const interval = setInterval(() => {
      setGreetingData(getGreetingData(userName));
    }, 60000);

    return () => clearInterval(interval);
  }, [userName]);

  return greetingData;
};

const getGreetingData = (userName?: string): GreetingData => {
  const hour = new Date().getHours();
  const name = userName || 'there';

  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good morning, ${name}`,
      emoji: '☀️',
      timeOfDay: 'morning',
      color: 'from-amber-400/20 to-orange-400/20',
      message: 'Ready to start your day fresh?'
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon, ${name}`,
      emoji: '🌤️',
      timeOfDay: 'afternoon',
      color: 'from-sky-400/20 to-blue-400/20',
      message: 'Hope your day is going well!'
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: `Good evening, ${name}`,
      emoji: '🌆',
      timeOfDay: 'evening',
      color: 'from-purple-400/20 to-pink-400/20',
      message: 'Time to wind down and relax'
    };
  } else {
    return {
      greeting: `Good night, ${name}`,
      emoji: '🌙',
      timeOfDay: 'night',
      color: 'from-indigo-400/20 to-violet-400/20',
      message: 'Burning the midnight oil?'
    };
  }
};
