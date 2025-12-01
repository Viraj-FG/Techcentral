import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSecretStatus, SECRET_GROUPS } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecretGroupStatus {
  name: string;
  total: number;
  configured: number;
  missing: number;
  configuredSecrets: string[];
  missingSecrets: string[];
  status: 'healthy' | 'degraded' | 'critical';
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  secretGroups: SecretGroupStatus[];
  summary: {
    totalSecrets: number;
    configured: number;
    missing: number;
    configurationPercentage: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretGroupStatuses: SecretGroupStatus[] = [];
    let totalConfigured = 0;
    let totalMissing = 0;
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Check each SECRET_GROUP
    for (const [groupName, secretNames] of Object.entries(SECRET_GROUPS)) {
      const status = getSecretStatus(secretNames);
      
      // Determine group health status
      let groupStatus: 'healthy' | 'degraded' | 'critical';
      if (status.missing.length === 0) {
        groupStatus = 'healthy';
      } else if (status.missing.length < status.total / 2) {
        groupStatus = 'degraded';
      } else {
        groupStatus = 'critical';
      }

      secretGroupStatuses.push({
        name: groupName,
        total: status.total,
        configured: status.configured.length,
        missing: status.missing.length,
        configuredSecrets: status.configured,
        missingSecrets: status.missing,
        status: groupStatus,
      });

      totalConfigured += status.configured.length;
      totalMissing += status.missing.length;

      // Update overall status
      if (groupStatus === 'critical') {
        overallStatus = 'critical';
      } else if (groupStatus === 'degraded' && overallStatus !== 'critical') {
        overallStatus = 'degraded';
      }
    }

    const totalSecrets = totalConfigured + totalMissing;
    const configurationPercentage = totalSecrets > 0 
      ? Math.round((totalConfigured / totalSecrets) * 100) 
      : 0;

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      secretGroups: secretGroupStatuses,
      summary: {
        totalSecrets,
        configured: totalConfigured,
        missing: totalMissing,
        configurationPercentage,
      },
    };

    console.log('🏥 Health check:', {
      status: overallStatus,
      configured: totalConfigured,
      missing: totalMissing,
      percentage: configurationPercentage,
    });

    // Return appropriate HTTP status code based on health
    const httpStatus = overallStatus === 'healthy' ? 200 
      : overallStatus === 'degraded' ? 207 
      : 503;

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: httpStatus,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        } 
      }
    );

  } catch (error) {
    console.error('❌ Health check error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'critical',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
