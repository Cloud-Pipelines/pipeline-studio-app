import { useEffect, useState } from "react";

const useCooldownTimer = (initialTime = 0) => {
  const [cooldownTime, setCooldownTime] = useState(initialTime);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldownTime]);

  return { cooldownTime, setCooldownTime };
};

export default useCooldownTimer;
