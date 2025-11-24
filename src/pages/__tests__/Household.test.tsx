import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Household from '../Household';
import { mockSupabase } from '../../test/mocks/supabase';

// Mock child components
vi.mock('@/components/HouseholdMemberCard', () => ({
  default: ({ member, onDelete }: { member: any, onDelete: any }) => (
    <div data-testid={`member-${member.id}`}>
      {member.name}
      <button onClick={() => onDelete(member)}>Delete</button>
    </div>
  )
}));

vi.mock('@/components/HouseholdMemberForm', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: any, onCancel: any }) => (
    <div data-testid="member-form">
      <button onClick={() => onSubmit({ name: 'New Member', role: 'child' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

const renderHousehold = () => {
  return render(
    <BrowserRouter>
      <Household />
    </BrowserRouter>
  );
};

describe('Household Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays household members', async () => {
    const mockMembers = [
      { id: '1', name: 'John Doe', role: 'adult' },
      { id: '2', name: 'Jane Doe', role: 'child' }
    ];

    // Mock auth user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user123' } } },
      error: null
    });

    // Robust mock for multiple tables
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'household_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }),
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn()
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { current_household_id: 'house123' }, error: null })
            })
          })
        } as any;
      }
      return { select: vi.fn().mockReturnThis() } as any;
    });

    renderHousehold();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('opens add member dialog', async () => {
    // Mock auth user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user123' } } },
      error: null
    });

    // Robust mock for multiple tables
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'household_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          }),
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn()
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { current_household_id: 'house123' }, error: null })
            })
          })
        } as any;
      }
      return { select: vi.fn().mockReturnThis() } as any;
    });

    renderHousehold();

    const addButton = await screen.findByText(/add member/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('member-form')).toBeInTheDocument();
    });
  });
});
