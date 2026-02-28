import { useEffect, useRef, useState, useCallback } from 'react';

type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseSSEOptions {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  withCredentials?: boolean;
}

interface UseSSEReturn {
  status: SSEStatus;
  disconnect: () => void;
  reconnect: () => void;
}

export function useSSE({
  url,
  onMessage,
  onError,
  withCredentials = false,
}: UseSSEOptions): UseSSEReturn {
  const [status, setStatus] = useState<SSEStatus>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('connecting');

    const token = localStorage.getItem('access_token');
    const separator = url.includes('?') ? '&' : '?';
    const urlWithToken = token ? `${url}${separator}token=${token}` : url;

    const eventSource = new EventSource(urlWithToken, { withCredentials });

    eventSource.onopen = () => setStatus('connected');

    eventSource.onmessage = (event) => onMessage?.(event);

    eventSource.onerror = (error) => {
      setStatus('error');
      onError?.(error);
    };

    eventSourceRef.current = eventSource;
  }, [url, onMessage, onError, withCredentials]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { status, disconnect, reconnect: connect };
}
