import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScanResults from '../ScanResults';

// Mock result components
vi.mock('../result-modes/InventorySweepResult', () => ({
  default: () => <div data-testid="inventory-result">Inventory Result</div>,
}));
vi.mock('../result-modes/ApplianceScanResult', () => ({
  default: () => <div data-testid="appliance-result">Appliance Result</div>,
}));
vi.mock('../result-modes/VanitySweepResult', () => ({
  default: () => <div data-testid="vanity-result">Vanity Result</div>,
}));
vi.mock('../result-modes/NutritionTrackResult', () => ({
  default: () => <div data-testid="nutrition-result">Nutrition Result</div>,
}));
vi.mock('../result-modes/ProductAnalysisResult', () => ({
  default: () => <div data-testid="product-result">Product Result</div>,
}));
vi.mock('../result-modes/PetIdResult', () => ({
  default: () => <div data-testid="pet-result">Pet Result</div>,
}));

describe('ScanResults', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    confidence: 0.9,
    items: [],
    suggestion: 'Test suggestion',
    onItemsAdded: vi.fn(),
  };

  it('renders InventorySweepResult for INVENTORY_SWEEP intent', () => {
    render(<ScanResults {...defaultProps} intent="INVENTORY_SWEEP" />);
    expect(screen.getByTestId('inventory-result')).toBeInTheDocument();
  });

  it('renders ApplianceScanResult for APPLIANCE_SCAN intent', () => {
    render(<ScanResults {...defaultProps} intent="APPLIANCE_SCAN" />);
    expect(screen.getByTestId('appliance-result')).toBeInTheDocument();
  });

  it('renders VanitySweepResult for VANITY_SWEEP intent', () => {
    render(<ScanResults {...defaultProps} intent="VANITY_SWEEP" />);
    expect(screen.getByTestId('vanity-result')).toBeInTheDocument();
  });

  it('renders NutritionTrackResult for NUTRITION_TRACK intent', () => {
    render(<ScanResults {...defaultProps} intent="NUTRITION_TRACK" />);
    expect(screen.getByTestId('nutrition-result')).toBeInTheDocument();
  });

  it('renders ProductAnalysisResult for PRODUCT_ANALYSIS intent', () => {
    render(<ScanResults {...defaultProps} intent="PRODUCT_ANALYSIS" />);
    expect(screen.getByTestId('product-result')).toBeInTheDocument();
  });

  it('renders PetIdResult for PET_ID intent', () => {
    render(<ScanResults {...defaultProps} intent="PET_ID" />);
    expect(screen.getByTestId('pet-result')).toBeInTheDocument();
  });
});
