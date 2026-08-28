import LegacyContentPage from '../components/legacy/LegacyContentPage.jsx';

export function PolicyPage() {
  return <LegacyContentPage className="legal-page policy-page" source="/policy.html" title="Chính Sách | DoRentMe" />;
}

export function TermsPage() {
  return <LegacyContentPage className="legal-page terms-page" source="/terms.html" title="Điều Khoản Sử Dụng | DoRentMe" />;
}
