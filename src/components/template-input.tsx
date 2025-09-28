import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid';

interface VariableChip {
  id: string;
  handle: string;
  startPos: number;
  endPos: number;
}

interface TemplateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: string;
}

export const TemplateInput = forwardRef(function TemplateInput(
  {
    className,
    value,
    onChange,
    placeholder,
    disabled = false,
    type = "text",
    ...props
  }: TemplateInputProps & Omit<Headless.InputProps, 'as' | 'className' | 'value' | 'onChange'>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Forward the ref to the input element
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);


  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Parse template variables from text
  const parseVariables = (text: string): VariableChip[] => {
    const variables: VariableChip[] = [];
    const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      variables.push({
        id: `${match.index}-${match[1]}`,
        handle: match[1].trim(),
        startPos: match.index,
        endPos: match.index + match[0].length
      });
    }
    
    return variables;
  };

  const removeVariable = (variable: VariableChip) => {
    const newValue = value.slice(0, variable.startPos) + value.slice(variable.endPos);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the onChange call (same pattern as template-textarea)
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  const handleEditBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(value); // Reset to original
      setIsEditing(false);
    } else if (e.key === 'Enter') {
      handleEditBlur();
    }
  };

  const handleContainerClick = () => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
      // Focus input after state update
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Render preview with variable chips
  const renderPreviewContent = () => {
    const variables = parseVariables(value);
    if (variables.length === 0) {
      return (
        <div className="text-zinc-500 dark:text-zinc-400 pointer-events-none">
          {value || placeholder}
        </div>
      );
    }

    const parts = [];
    let lastIndex = 0;

    variables.forEach((variable, index) => {
      // Add text before variable
      if (variable.startPos > lastIndex) {
        const textPart = value.slice(lastIndex, variable.startPos);
        if (textPart) {
          parts.push(
            <span key={`text-${index}`}>
              {textPart}
            </span>
          );
        }
      }

      // Add variable chip
      parts.push(
        <span
          key={variable.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 rounded text-xs font-mono border border-sky-200 dark:border-sky-700/50"
          style={{ 
            verticalAlign: 'middle',
            display: 'inline-flex',
            lineHeight: '1'
          }}
        >
          <span className="truncate max-w-[120px]">{variable.handle}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeVariable(variable);
            }}
            className="flex-shrink-0 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors ml-1"
            title="Remove variable"
          >
            <XMarkIcon className="w-2.5 h-2.5" />
          </button>
        </span>
      );

      lastIndex = variable.endPos;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      const remainingText = value.slice(lastIndex);
      if (remainingText) {
        parts.push(
          <span key="remaining">
            {remainingText}
          </span>
        );
      }
    }

    return (
      <span style={{ display: 'inline' }}>
        {parts.length > 0 ? parts : (
          <span className="text-zinc-500 dark:text-zinc-400">
            {placeholder}
          </span>
        )}
      </span>
    );
  };

  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        // Basic layout
        'relative block w-full',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:after:focus-within:ring-2 sm:after:focus-within:ring-blue-500',
        // Disabled state
        disabled && 'opacity-50 before:bg-zinc-950/5 before:shadow-none',
      ])}
      onClick={handleContainerClick}
    >
      {isEditing ? (
        <Headless.Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => {
            const newValue = e.target.value;

            // Update local state immediately for responsive UI
            setEditValue(newValue);

            // Clear existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            // Debounce the onChange call (same pattern as template-textarea)
            timeoutRef.current = setTimeout(() => {
              onChange(newValue);
            }, 300);
          }}
          onBlur={handleEditBlur}
          onKeyDown={handleEditKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          {...props}
          className={clsx([
            // Basic layout
            'relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
            // Typography
            'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
            // Border
            'border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20',
            // Background color
            'bg-transparent dark:bg-white/5',
            // Hide default focus styles
            'focus:outline-none',
            // Invalid state
            'data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-600 data-[invalid]:data-[hover]:dark:border-red-600',
            // Disabled state
            'disabled:border-zinc-950/20 disabled:dark:border-white/15 disabled:dark:bg-white/[2.5%] dark:data-[hover]:disabled:border-white/15',
          ])}
          autoFocus
        />
      ) : (
        <div
          className={clsx([
            'relative block w-full rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
            'text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white',
            'border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20',
            'bg-transparent dark:bg-white/5',
            disabled && 'border-zinc-950/20 dark:border-white/15 dark:bg-white/[2.5%]',
            'cursor-text'
          ])}
        >
          {renderPreviewContent()}
        </div>
      )}
    </span>
  )
})