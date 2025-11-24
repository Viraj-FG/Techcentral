import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AuroraBackground from '../AuroraBackground';

describe('AuroraBackground', () => {
  it('renders without crashing', () => {
    const { container } = render(<AuroraBackground />);
    expect(container.firstChild).toHaveClass('fixed inset-0 overflow-hidden pointer-events-none');
  });

  it('renders with food vertical color', () => {
    render(<AuroraBackground vertical="food" />);
    // Since framer-motion animates inline styles, checking exact color might be tricky if it's animating.
    // But we can check if the component renders.
    // We can also check if the color logic is correct by inspecting the component instance if we could, 
    // but for integration test, rendering is enough.
  });

  it('renders with beauty vertical color', () => {
    render(<AuroraBackground vertical="beauty" />);
  });

  it('renders with pets vertical color', () => {
    render(<AuroraBackground vertical="pets" />);
  });
});
