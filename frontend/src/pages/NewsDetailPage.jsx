import { Link, useSearchParams } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { newsArticles } from '../data/newsArticles.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

function legacyIndex(value) {
  const parsed = Number.parseInt(value, 10);
  return parsed || 0;
}

export default function NewsDetailPage() {
  const [params] = useSearchParams();
  const index = legacyIndex(params.get('index'));
  const dataArticle = newsArticles[index];
  const article = {
    title: params.get('title') || dataArticle?.title || newsArticles[0].title,
    date: params.get('date') || dataArticle?.date || newsArticles[0].date,
    image: params.get('image') || dataArticle?.image || newsArticles[0].image,
    description: params.get('description') || dataArticle?.description || newsArticles[0].description,
    content: dataArticle?.content || newsArticles[0].content,
  };
  const nextIndex = index + 1;
  const hasNext = nextIndex < newsArticles.length;
  useDocumentTitle(`${article.title} | DoRentMe`);

  return (
    <div className="news-detail-page">
      <div className="detail-wrapper">
        <div className="detail-inner">
          <Link to="/news" className="back-link">← Quay lại Tin tức</Link>
          <div className="detail-date">📅 {article.date}</div>
          <h1 className="detail-title">{article.title}</h1>
          {article.image ? <img className="detail-banner" src={imageUrl(article.image)} alt={article.title} /> : null}
          <div className="detail-body">
            {article.content ? (
              <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <>
                <div className="coming-icon">🛠️</div>
                <h3>Nội dung đang được nâng cấp</h3>
                <p>Bài viết chi tiết sẽ sớm được cập nhật. Vui lòng quay lại sau!</p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bottom-bar">
        <div className="now-reading"><span className="label">Đang xem:</span><span className="title">{article.title}</span></div>
        {hasNext ? <Link className="next-btn" to={`/news_detail?index=${nextIndex}`}>Bài sau ›</Link> : <span className="next-btn disabled">Hết bài</span>}
      </div>
    </div>
  );
}
