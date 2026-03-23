import { useState, useEffect, useRef } from 'react';

export default function StatCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let current = 0;
          const duration = 1500; // 1.5 seconds anim duration
          const increment = Math.ceil(target / 40) || 1; 
          const intervalRate = duration / (target / increment);

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(current);
            }
          }, Math.max(10, intervalRate || 20));

          observer.unobserve(ref.current);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}
