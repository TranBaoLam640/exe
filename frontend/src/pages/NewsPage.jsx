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
    <div className="news-page news-wrapper">
      <div className="page-heading"><h1>Tin Tức</h1><div className="underline" /></div>
      <div className="news-grid">
        {slice.map((article, index) => <NewsCard article={article} index={start + index} key={article.title} />)}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goPage} />
    </div>
  );
}
