import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/integrations/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Ping timeout')), 5000)
    );

    const { error } = await Promise.race([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      timeoutPromise
    ]) as any;

    if (error) {
      console.error('❌ Supabase connection check failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection healthy');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection check error:', err);
    return false;
  }
}
