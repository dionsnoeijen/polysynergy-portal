import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

interface VariableChip {
  id: string;
  handle: string;
  startPos: number;
  endPos: number;
}

interface TemplateTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const TemplateTextarea: React.FC<TemplateTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

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
        <VariableChipComponent
          key={variable.id}
          handle={variable.handle}
          onRemove={() => removeVariable(variable)}
        />
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
      <div className="whitespace-pre-wrap break-words">
        {parts.length > 0 ? parts : (
          <span className="text-zinc-500 dark:text-zinc-400">
            {placeholder}
          </span>
        )}
      </div>
    );
  };

  const removeVariable = (variable: VariableChip) => {
    const newValue = value.slice(0, variable.startPos) + value.slice(variable.endPos);
    onChange(newValue);
  };

  const handleEditBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(value); // Reset to original
      setIsEditing(false);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleEditBlur();
    }
  };

  const handleContainerClick = () => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
    }
  };

  return (
    <span
      data-slot="control"
      className={clsx([
        'relative block w-full min-h-[2.5rem]',
        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
        'before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow',
        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
        'dark:before:hidden',
        // Focus ring
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent',
        isEditing && 'sm:after:ring-2 sm:after:ring-blue-500',
        // Disabled state
        disabled && 'opacity-50 before:bg-zinc-950/5 before:shadow-none',
        className
      ])}
      onClick={handleContainerClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            const newValue = e.target.value;

            // Update local state immediately for responsive UI
            setEditValue(newValue);

            // Clear existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            // Debounce the onChange call (same pattern as group-name.tsx)
            timeoutRef.current = setTimeout(() => {
              onChange(newValue);
            }, 300);
          }}
          onBlur={handleEditBlur}
          onKeyDown={handleEditKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx([
            // Basic layout
            'relative block h-full w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
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
            // Resizable
            'resize-none'
          ])}
          autoFocus
        />
      ) : (
        <div
          className={clsx([
            'relative block h-full w-full rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]',
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
  );
};

interface VariableChipProps {
  handle: string;
  onRemove: () => void;
}

const VariableChipComponent: React.FC<VariableChipProps> = ({ handle, onRemove }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 rounded-md text-sm font-mono border border-sky-200 dark:border-sky-700/50">
      <span className="truncate max-w-[200px]">{handle}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex-shrink-0 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors"
        title="Remove variable"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );
};

export default TemplateTextarea;