import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppForm } from './app-form';
import { FormFieldFactory } from './form-field-factory';

const schema = z.object({ password: z.string().min(8, 'Use pelo menos 8 caracteres') });

function TestForm({
  onSubmit,
  required = false,
}: {
  onSubmit: (values: z.infer<typeof schema>) => void;
  required?: boolean;
}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  });
  return (
    <AppForm form={form} onSubmit={onSubmit}>
      <FormFieldFactory
        control={form.control}
        name='password'
        label='Senha'
        fieldType='password'
        required={required}
      />
      <button type='submit'>Enviar</button>
    </AppForm>
  );
}

describe('FormFieldFactory', () => {
  it('destaca em vermelho o asterisco de campos obrigatórios', () => {
    render(<TestForm onSubmit={vi.fn()} required />);
    expect(screen.getByText('*')).toHaveClass('text-red-500');
  });

  it('associa o erro de validação ao campo e permite corrigir o envio', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    const input = screen.getByLabelText('Senha');
    expect(await screen.findByRole('alert')).toHaveTextContent('Use pelo menos 8 caracteres');
    expect(input).toHaveAccessibleDescription('Use pelo menos 8 caracteres');
    expect(input).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.type(input, 'senha-ficticia');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ password: 'senha-ficticia' });
  });

  it('permite alternar a visibilidade da senha pelo teclado sem enviar o formulário', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);
    await user.tab();
    await user.type(screen.getByLabelText('Senha'), 'senha-ficticia');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
