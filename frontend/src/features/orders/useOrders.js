import { useEffect, useState } from 'react';
import { getSession } from '../auth/authService.js';
import { fetchBackendOrder, fetchBackendOrders } from './orderApi.js';
import { getOrders, ORDERS_CHANGED_EVENT, ORDERS_KEY } from './orderCreation.js';

export function useOrders() {
  const [orders, setOrders] = useState(() => (getSession() ? [] : getOrders()));

  useEffect(() => {
    let cancelled = false;
    const update = () => {
      if (getSession()) {
        fetchBackendOrders()
          .then((serverOrders) => {
            if (!cancelled) setOrders(serverOrders);
          })
          .catch(() => {
            if (!cancelled) setOrders([]);
          });
        return;
      }

      setOrders(getOrders());
    };
    const onStorage = (event) => {
      if (event.key === ORDERS_KEY) update();
    };

    update();
    document.addEventListener(ORDERS_CHANGED_EVENT, update);
    document.addEventListener('auth:changed', update);
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      document.removeEventListener(ORDERS_CHANGED_EVENT, update);
      document.removeEventListener('auth:changed', update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return orders;
}

export function useOrderById(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId && getSession()));

  useEffect(() => {
    let cancelled = false;
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!getSession()) {
      setOrder(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    fetchBackendOrder(orderId)
      .then((serverOrder) => {
        if (!cancelled) setOrder(serverOrder);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return { order, loading };
}
