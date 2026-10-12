type ContactIconProps = {
  kind: "email" | "telegram" | "vk";
};

export default function ContactIcon({ kind }: ContactIconProps) {
  if (kind === "email") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <rect x="3.5" y="7" width="25" height="18" rx="2.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="m5 9 11 9 11-9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "telegram") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M28.2 5.2 3.7 14.6a1 1 0 0 0 .1 1.9l6.4 1.9 2.4 7.1a1 1 0 0 0 1.7.4l3.6-4.1 5.4 4a1 1 0 0 0 1.6-.6L29.6 6a1 1 0 0 0-1.4-.8Z"
          fill="currentColor"
        />
        <path
          d="m10.2 18.4 15-10.4-11.7 13.1-.9 4.4"
          stroke="var(--channel-color)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 8h4.2c.2 0 .4.2.5.4 1.1 3.9 2.7 7.2 4.2 7.8.5.2.7-.3.7-1.1v-4.6c-.1-1.1-.5-1.5-1.1-1.7V8h6.1v8c0 .7.3 1 .8.7 1.5-.9 3.1-4.2 3.8-8.1.1-.4.3-.6.7-.6h4.1c.5 0 .7.2.6.7-.6 3-2.4 6.3-4.3 8.7-.4.5-.4.7.1 1.2 2.1 2 4.5 4.7 5 7.2.1.5-.2.8-.7.8h-4.3c-.5 0-.7-.2-1-.6-1.2-1.8-2.7-3.7-3.7-3.7-.5 0-.6.2-.6.8v2.8c0 .5-.2.7-.7.7h-1.9C8.6 26.6 5 18 3.4 8.8 3.3 8.3 3.5 8 4 8Z"
      />
    </svg>
  );
}
