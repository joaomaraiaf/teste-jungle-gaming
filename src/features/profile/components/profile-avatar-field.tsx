import { Button } from '@/core/components/ui/button';
import { Smile } from 'lucide-react';
import { useRef } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';
import type { ProfileFormValues } from '../data/schemas/profile.schema';

interface ProfileAvatarFieldProps {
  form: UseFormReturn<ProfileFormValues>;
  onSelect: (file?: File) => Promise<void>;
  onRemove: () => void;
}

export function ProfileAvatarField({ form, onSelect, onRemove }: ProfileAvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const avatar = useWatch({ control: form.control, name: 'avatarDataUrl' });
  const error = form.formState.errors.avatarDataUrl;
  return (
    <fieldset className='flex min-w-0 flex-col gap-3'>
      <legend className='mb-3 text-sm'>Avatar</legend>
      <div className='flex flex-wrap items-center gap-5'>
        <div className='grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#38220F] text-[#D28A4C]'>
          {avatar ? (
            <img src={avatar} alt='Avatar do colecionador' className='size-full object-cover' />
          ) : (
            <Smile aria-hidden='true' className='size-6' />
          )}
        </div>
        <input
          ref={inputRef}
          type='file'
          accept='image/png,image/jpeg,image/webp'
          aria-label='Selecionar avatar'
          className='sr-only'
          tabIndex={-1}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            await onSelect(file);
          }}
        />
        <Button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='h-10 rounded-sm bg-[#D28A4C] px-6 font-bold text-[#140D0A] hover:bg-[#E89B55]'
        >
          Alterar
        </Button>
        <button
          type='button'
          onClick={onRemove}
          className='text-sm hover:text-[#E89B55] focus-visible:outline-2 focus-visible:outline-[#D28A4C]'
        >
          Remover
        </button>
      </div>
      {error && (
        <p role='alert' className='text-xs text-[#F0805F]'>
          {error.message}
        </p>
      )}
    </fieldset>
  );
}
