import React from 'react';

export const BreathingGuide: React.FC = () => {
  const [scale, setScale] = React.useState(1);
  
  React.useEffect(() => {
    const breathCycle = () => {
      // Inhale: 4 seconds
      setScale(1.5);
      setTimeout(() => {
        // Hold: 4 seconds
        setTimeout(() => {
          // Exhale: 4 seconds
          setScale(1);
        }, 4000);
      }, 4000);
    };

    const interval = setInterval(breathCycle, 12000); // 12-second cycle
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="w-16 h-16 bg-indigo-500 rounded-full opacity-50 transition-transform duration-[4000ms]"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
};