import { useId } from "react";
import * as Select from "@radix-ui/react-select";
import ArrowIcon from "./ArrowIcon";
import "./OsnovaSelect.css";

type Option = { value: string; label: string; disabled?: boolean };

type OsnovaSelectProps = {
  ariaLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly Option[];
};

export default function OsnovaSelect({
  ariaLabel,
  value,
  onValueChange,
  options,
}: OsnovaSelectProps) {
  const id = useId();
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className="osnova-select-trigger"
        aria-label={ariaLabel}
        data-value={value}
        id={id}
      >
        <Select.Value />
        <Select.Icon className="osnova-select-icon" aria-hidden="true">
          <ArrowIcon direction="chevron-down" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="osnova-select-content"
          position="popper"
          sideOffset={6}
          collisionPadding={12}
        >
          <Select.ScrollUpButton className="osnova-select-scroll">
            <ArrowIcon direction="up" />
          </Select.ScrollUpButton>
          <Select.Viewport className="osnova-select-viewport">
            {options.map((option) => (
              <Select.Item
                className="osnova-select-item"
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="osnova-select-indicator">✓</Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="osnova-select-scroll">
            <ArrowIcon direction="down" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
