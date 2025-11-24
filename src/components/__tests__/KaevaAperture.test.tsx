import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import KaevaAperture from '../KaevaAperture';

describe('KaevaAperture', () => {
  it('renders with default props', () => {
    const { container } = render(<KaevaAperture state="idle" />);
    expect(container.firstChild).toHaveClass('w-28 h-28'); // md size
  });

  it('renders with small size', () => {
    const { container } = render(<KaevaAperture state="idle" size="sm" />);
    expect(container.firstChild).toHaveClass('w-20 h-20');
  });

  it('renders with large size', () => {
    const { container } = render(<KaevaAperture state="idle" size="lg" />);
    expect(container.firstChild).toHaveClass('w-32 h-32');
  });
});
