import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SocialImport from '../SocialImport';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('SocialImport', () => {
  it('renders dialog when open', () => {
    render(
      <SocialImport 
        open={true} 
        onClose={() => {}} 
        userId="test-user" 
      />
    );

    expect(screen.getByText('Social Recipe Import')).toBeInTheDocument();
    expect(screen.getByText('Paste Link')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <SocialImport 
        open={false} 
        onClose={() => {}} 
        userId="test-user" 
      />
    );

    expect(screen.queryByText('Import Recipe')).not.toBeInTheDocument();
  });
});
