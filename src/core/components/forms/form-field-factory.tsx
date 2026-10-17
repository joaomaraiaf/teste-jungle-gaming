import { Field, FieldError, FieldLabel } from '@/core/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/core/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';

interface FormFieldFactoryProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  placeholder?: string;
  fieldType?: 'text' | 'email' | 'password' | 'select';
  options?: { label: string; value: string }[];
  className?: string;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function FormFieldFactory<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  fieldType = 'text',
  options = [],
  className,
  readOnly = false,
  required = false,
  autoComplete,
  leftIcon,
  rightIcon,
}: FormFieldFactoryProps<TFieldValues>) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={inputId}>
            {label}
            {required && (
              <span aria-hidden='true' className='text-red-500'>
                {' *'}
              </span>
            )}
          </FieldLabel>
          {fieldType === 'select' ? (
            <Select
              name={field.name}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              disabled={readOnly || field.disabled}
              required={required}
            >
              <SelectTrigger
                id={inputId}
                ref={field.ref}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? errorId : undefined}
                className='w-full'
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <InputGroup>
              {leftIcon && <InputGroupAddon align='inline-start'>{leftIcon}</InputGroupAddon>}
              <InputGroupInput
                {...field}
                value={field.value ?? ''}
                id={inputId}
                type={fieldType === 'password' && showPassword ? 'text' : fieldType}
                placeholder={placeholder}
                autoComplete={autoComplete}
                readOnly={readOnly}
                required={required}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? errorId : undefined}
              />
              {(rightIcon || fieldType === 'password') && (
                <InputGroupAddon align='inline-end'>
                  {rightIcon}
                  {fieldType === 'password' && (
                    <button
                      type='button'
                      onClick={() => setShowPassword((visible) => !visible)}
                      disabled={field.disabled}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={showPassword}
                      className='rounded-sm focus-visible:outline-2 focus-visible:outline-ring'
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden='true' className='size-4' />
                      ) : (
                        <Eye aria-hidden='true' className='size-4' />
                      )}
                    </button>
                  )}
                </InputGroupAddon>
              )}
            </InputGroup>
          )}
          {fieldState.invalid && <FieldError id={errorId} errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
