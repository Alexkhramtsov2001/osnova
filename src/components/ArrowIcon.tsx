type ArrowIconProps = {
  direction?: "up-right" | "down" | "up" | "chevron-down";
  className?: string;
};

const paths = {
  "up-right": "M5 19 19 5M8 5h11v11",
  down: "M12 4v16m-7-7 7 7 7-7",
  up: "M12 20V4m-7 7 7-7 7 7",
  "chevron-down": "m6 9 6 6 6-6",
} as const;

export default function ArrowIcon({ direction = "up-right", className = "" }: ArrowIconProps) {
  return (
    <svg
      className={`arrow-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[direction]} />
    </svg>
  );
}
