import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

const ProgressBar = ({ visible }: { visible: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[1300]">
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  );
};

export default ProgressBar;
