import { useEffect, useState } from 'react';
import { AI_SUBSCRIPTION_CHANGED_EVENT, getAiAccessStatus } from './aiPackages.js';

export default function AiPlanBanner({ onOpenPricingModal }) {
  const [status, setStatus] = useState(() => getAiAccessStatus());

  useEffect(() => {
    function update() {
      setStatus(getAiAccessStatus());
    }

    document.addEventListener(AI_SUBSCRIPTION_CHANGED_EVENT, update);
    window.addEventListener('storage', update);

    return () => {
      document.removeEventListener(AI_SUBSCRIPTION_CHANGED_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const isUnlimited = status.mode === 'unlimited';
  const isPaidTurns = status.mode === 'turns';
  const isExceeded = status.mode === 'quota_exceeded';

  return (
    <div className={`ai-plan-banner ${isUnlimited ? 'unlimited' : isPaidTurns ? 'paid' : isExceeded ? 'exceeded' : 'free'}`}>
      <div className="ai-plan-banner-info">
        <div className="ai-plan-status-pill">
          <span className="dot" aria-hidden="true" />
          <span>{status.badge}</span>
        </div>
        <div className="ai-plan-banner-text">
          <strong>{status.planName}</strong>
          <span> · {status.description}</span>
        </div>
      </div>

      <div className="ai-plan-banner-actions">
        <button
          type="button"
          className="ai-plan-btn"
          onClick={onOpenPricingModal}
        >
          {isExceeded ? 'Mua gói để thử đồ (từ 1k) →' : 'Xem các gói AI (1k - 10k - 50k) ✨'}
        </button>
      </div>
    </div>
  );
}
