import { useState } from 'react';
import NewsCard from '../features/news/NewsCard.jsx';
import Pagination from '../features/news/Pagination.jsx';
import { newsArticles } from '../data/newsArticles.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const ITEMS_PER_PAGE = 4;

export default function NewsPage() {
  useDocumentTitle('Tin Tức | DoRentMe');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(newsArticles.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const slice = newsArticles.slice(start, start + ITEMS_PER_PAGE);

  function goPage(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="news-page">
      <section className="page-hero">
        <span className="page-hero-badge">✦ Tin tức & Xu hướng</span>
        <h1>Tin Tức <span>Thời Trang</span></h1>
        <p>Cập nhật những xu hướng thời trang mới nhất, phong cách nổi bật và câu chuyện từ DoRentMe.</p>
      </section>
      <div className="news-wrapper" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 60px' }}>
        <div className="news-grid">
          {slice.map((article, index) => <NewsCard article={article} index={start + index} key={article.title} />)}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goPage} />
      </div>
    </div>
  );
}
