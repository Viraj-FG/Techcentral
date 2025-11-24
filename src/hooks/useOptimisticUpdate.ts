import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useOptimisticUpdate = <T = any>() => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const performUpdate = useCallback(
    async (
      optimisticData: T,
      updateFn: () => Promise<T>,
      options?: OptimisticUpdateOptions<T>
    ): Promise<{ success: boolean; data?: T; error?: Error }> => {
      setIsUpdating(true);

      // Immediately apply optimistic update
      options?.onSuccess?.(optimisticData);

      try {
        // Perform actual update
        const result = await updateFn();

        if (options?.successMessage) {
          toast({
            title: 'Success',
            description: options.successMessage,
          });
        }

        setIsUpdating(false);
        return { success: true, data: result };
      } catch (error) {
        // Revert optimistic update on error
        setIsUpdating(false);

        const err = error as Error;
        options?.onError?.(err);

        toast({
          title: 'Error',
          description: options?.errorMessage || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });

        return { success: false, error: err };
      }
    },
    [toast]
  );

  return {
    isUpdating,
    performUpdate,
  };
};
