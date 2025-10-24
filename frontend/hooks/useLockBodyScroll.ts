'use client';

import { useEffect } from 'react';

const useLockBodyScroll = (shouldLock: boolean) => {
  useEffect(() => {
    if (!shouldLock || typeof document === 'undefined') {
      return () => undefined;
    }

    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset;

    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
      width: body.style.width,
    } as const;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [shouldLock]);
};

export default useLockBodyScroll;
