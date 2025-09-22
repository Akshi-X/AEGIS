import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 2v4" />
      <path d="m16.2 3.8 -2.9 2.9" />
      <path d="M22 10h-4" />
      <path d="m16.2 16.2-2.9-2.9" />
      <path d="M12 22v-4" />
      <path d="m7.8 16.2 2.9-2.9" />
      <path d="M2 10h4" />
      <path d="m7.8 3.8 2.9 2.9" />
    </svg>
  );
}
