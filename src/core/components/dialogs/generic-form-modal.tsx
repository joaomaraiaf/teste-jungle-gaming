import type * as React from 'react';
import { type FieldValues, FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { cn } from '@/core/lib/utils';

interface GenericFormModalProps<TFormValues extends FieldValues>
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  form: UseFormReturn<TFormValues>;
  formContent: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  handleSubmit: (values: TFormValues) => void;
  renderSubmitButton?: React.ReactNode;
  isLoading?: boolean;
  disableFormSubmit?: boolean;
  trigger?: React.ReactNode;
}

export function GenericFormModal<TFormValues extends FieldValues>({
  children,
  trigger,
  title,
  description,
  form,
  formContent,
  className,
  open,
  onOpenChange,
  handleSubmit,
  isLoading = false,
  renderSubmitButton,
  disableFormSubmit = false,
}: GenericFormModalProps<TFormValues>) {
  const defaultSubmitButton = (
    <Button type='submit' variant='default' className='lg:min-w-80' size='lg' disabled={isLoading}>
      Salvar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger || children}</DialogTrigger>
      {open && (
        <DialogContent
          className={cn('sm:max-w-7xl h-fit p-0 flex flex-col gap-0 max-w-full', className)}
          aria-description={description ?? title}
        >
          <FormProvider {...form}>
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                if (disableFormSubmit) {
                  e.preventDefault();
                } else {
                  form.handleSubmit(handleSubmit)(e);
                }
              }}
              className='flex flex-col h-full max-h-dvh'
            >
              <DialogHeader className='border-b px-3 lg:px-8 py-4 h-fit'>
                <DialogTitle className='text-xl text-left font-semibold'>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
              </DialogHeader>

              <div className='flex flex-col gap-4 py-4 lg:py-5 px-3 lg:px-5 h-fit flex-1 overflow-y-auto w-full'>
                {formContent}
              </div>
              <DialogFooter className='p-4 gap-4 grid grid-cols-2 lg:flex flex-row place-content-between w-full sm:justify-between border-t h-fit'>
                <DialogClose asChild>
                  <Button variant='outline' type='button' className='lg:min-w-80' size='lg'>
                    Cancelar
                  </Button>
                </DialogClose>
                {renderSubmitButton ? renderSubmitButton : defaultSubmitButton}
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      )}
    </Dialog>
  );
}
