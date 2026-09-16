'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  duration = 1,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1] as const,
      onUpdate: (v) => setDisplay(v),
    });
    prevValue.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <>
      {display.toFixed(decimals)}
      {suffix}
    </>
  );
}
