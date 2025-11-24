import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HouseholdMemberForm from '../HouseholdMemberForm';

describe('HouseholdMemberForm', () => {
  it('renders form fields', () => {
    render(<HouseholdMemberForm onSubmit={() => {}} onCancel={() => {}} />);
    
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
  });

  it('submits form data', () => {
    const mockSubmit = vi.fn();
    render(<HouseholdMemberForm onSubmit={mockSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '25' } });

    const submitButton = screen.getByText('Add Member');
    fireEvent.click(submitButton);

    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Jane Doe',
      age: 25,
    }));
  });
});
