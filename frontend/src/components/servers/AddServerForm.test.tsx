import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { AddServerForm } from './AddServerForm';

// Validador manual de hostname para el prop test
const isValidHostnameOrIP = (host: string) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return ipv4Regex.test(host) || hostnameRegex.test(host);
};

describe('AddServerForm - Property based tests', () => {
    it('should only call onAdd if name is not empty and host is valid', () => {
        fc.assert(
            fc.property(
                fc.string({ maxLength: 50 }),
                fc.string({ maxLength: 50 }),
                (name, host) => {
                    const onAdd = vi.fn();
                    const { unmount } = render(<AddServerForm onAdd={onAdd} />);

                    const nameInput = screen.getByLabelText(/nombre del servidor/i);
                    const hostInput = screen.getByLabelText(/host/i);
                    const submitButton = screen.getByRole('button', { name: /guardar/i });

                    fireEvent.change(nameInput, { target: { value: name } });
                    fireEvent.change(hostInput, { target: { value: host } });
                    fireEvent.click(submitButton);

                    const nameValid = name.trim().length > 0;
                    const hostValid = host.trim().length > 0 && isValidHostnameOrIP(host.trim());

                    if (nameValid && hostValid) {
                        expect(onAdd).toHaveBeenCalledWith({ name: name.trim(), host: host.trim() });
                    } else {
                        expect(onAdd).not.toHaveBeenCalled();
                    }

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should clear form upon successful submission', () => {
        const onAdd = vi.fn();
        render(<AddServerForm onAdd={onAdd} />);

        const nameInput = screen.getByLabelText(/nombre del servidor/i) as HTMLInputElement;
        const hostInput = screen.getByLabelText(/host/i) as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /guardar/i });

        fireEvent.change(nameInput, { target: { value: 'Test Server' } });
        fireEvent.change(hostInput, { target: { value: '127.0.0.1' } });
        fireEvent.click(submitButton);

        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(nameInput.value).toBe('');
        expect(hostInput.value).toBe('');
    });
});
