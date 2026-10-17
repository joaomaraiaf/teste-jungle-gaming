import type * as React from 'react';
import {
  type FieldValues,
  FormProvider,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

interface AppFormProps<TFieldValues extends FieldValues>
  extends Omit<React.ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  children: React.ReactNode;
}

export function AppForm<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: AppFormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className} {...props}>
        {children}
      </form>
    </FormProvider>
  );
}
