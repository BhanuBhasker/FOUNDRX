import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge } from './Badge.jsx';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>React</Badge>);
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('renders a human-readable status label', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });
});
