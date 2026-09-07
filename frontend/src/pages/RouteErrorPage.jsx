import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

function getRouteErrorMessage(error) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || error.data?.message || 'Trang đang gặp lỗi.';
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return 'Trang đang gặp lỗi.';
}

export default function RouteErrorPage() {
  const error = useRouteError();

  return (
    <main className="not-found-page">
      <section className="not-found-content">
        <h1>Có lỗi xảy ra</h1>
        <p>{getRouteErrorMessage(error)}</p>
        <a className="btn btn-primary" href="/">
          Về trang chủ
        </a>
      </section>
    </main>
  );
}
