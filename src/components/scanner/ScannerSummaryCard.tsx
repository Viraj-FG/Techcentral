import { AlertTriangle, Clock, ShieldAlert, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScanSummary {
  totalItems: number;
  expiringSoon: number;
  allergenAlerts: number;
  lowStock: number;
  toxicWarnings?: number;
}

interface ScannerSummaryCardProps {
  summary: ScanSummary;
  onAddAll?: () => void;
  onReviewAlertsOnly?: () => void;
}

export const ScannerSummaryCard = ({ summary, onAddAll, onReviewAlertsOnly }: ScannerSummaryCardProps) => {
  const hasAlerts = summary.expiringSoon > 0 || summary.allergenAlerts > 0 || summary.lowStock > 0 || (summary.toxicWarnings || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3"
    >
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Found {summary.totalItems} item{summary.totalItems !== 1 ? 's' : ''}
          </h3>
        </div>
      </div>

      {/* Alert Badges */}
      {hasAlerts && (
        <div className="flex flex-wrap gap-2">
          {summary.expiringSoon > 0 && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Clock className="w-3 h-3 mr-1" />
              {summary.expiringSoon} Expiring Soon
            </Badge>
          )}
          {summary.allergenAlerts > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {summary.allergenAlerts} Allergen Alert{summary.allergenAlerts !== 1 ? 's' : ''}
            </Badge>
          )}
          {summary.lowStock > 0 && (
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {summary.lowStock} Low Stock
            </Badge>
          )}
          {(summary.toxicWarnings || 0) > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              <ShieldAlert className="w-3 h-3 mr-1" />
              {summary.toxicWarnings} Toxic Warning{summary.toxicWarnings !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        {onAddAll && (
          <Button onClick={onAddAll} size="sm" className="flex-1">
            Add All Safe Items
          </Button>
        )}
        {hasAlerts && onReviewAlertsOnly && (
          <Button onClick={onReviewAlertsOnly} size="sm" variant="outline" className="flex-1">
            Review Alerts Only
          </Button>
        )}
      </div>
    </motion.div>
  );
};