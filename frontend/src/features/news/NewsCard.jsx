import { Link } from 'react-router-dom';
import { imageUrl } from '../../assets/imageUrl.js';

export default function NewsCard({ article, index }) {
  return (
    <Link className="news-card" to={`/news_detail?index=${index}`}>
      {article.image ? (
        <img className="news-card-image" src={imageUrl(article.image)} alt={article.title} />
      ) : (
        <div className="news-card-image placeholder">📰</div>
      )}
      <div className="news-card-body">
        <div className="news-card-date">📅 {article.date}</div>
        <div className="news-card-title">{article.title}</div>
        <div className="news-card-desc">{article.description}</div>
        <span className="news-card-more">Đọc thêm →</span>
      </div>
    </Link>
  );
}
