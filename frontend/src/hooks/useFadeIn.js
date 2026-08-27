import { useEffect } from 'react';

export function useFadeIn(rootClassName) {
  useEffect(() => {
    const root = document.querySelector(rootClassName);
    if (!root) return undefined;

    const elements = root.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rootClassName]);
}
