import { useEffect, useState } from 'react';
import { getOrders, ORDERS_CHANGED_EVENT, ORDERS_KEY } from './orderCreation.js';

export function useOrders() {
  const [orders, setOrders] = useState(() => getOrders());

  useEffect(() => {
    const update = () => setOrders(getOrders());
    const onStorage = (event) => {
      if (event.key === ORDERS_KEY) update();
    };

    document.addEventListener(ORDERS_CHANGED_EVENT, update);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener(ORDERS_CHANGED_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return orders;
}
