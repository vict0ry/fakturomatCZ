import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle, Calendar, XCircle } from 'lucide-react';

interface SubscriptionData {
  status: string;
  trialEndsAt?: string;
  trialEnd?: string;
  planType: string;
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/stripe/subscription-status');
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !subscription) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'trial': return <Calendar className="w-3 h-3" />;
      case 'past_due': return <AlertCircle className="w-3 h-3" />;
      case 'canceled': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktivní';
      case 'trial': return 'Zkušební';
      case 'past_due': return 'Po splatnosti';
      case 'canceled': return 'Zrušeno';
      default: return status;
    }
  };

  const isTrialEnding = subscription.status === 'trial' && subscription.trialEnd;
  const trialDaysLeft = isTrialEnding ? 
    Math.max(0, Math.ceil((new Date(subscription.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${getStatusColor(subscription.status)} text-xs flex items-center gap-1`}>
        {getStatusIcon(subscription.status)}
        {getStatusText(subscription.status)}
      </Badge>
      {isTrialEnding && trialDaysLeft <= 3 && (
        <span className="text-xs text-yellow-600">
          {trialDaysLeft} {trialDaysLeft === 1 ? 'den' : 'dny'} zbývá
        </span>
      )}
    </div>
  );
}