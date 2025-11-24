import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavLink } from '../NavLink';

describe('NavLink', () => {
  it('renders link', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText('Test Link')).toHaveAttribute('href', '/test');
  });

  it('applies active class', () => {
    render(
      <MemoryRouter initialEntries={['/test']}>
        <NavLink to="/test" activeClassName="active-link">Test Link</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText('Test Link')).toHaveClass('active-link');
  });
});
