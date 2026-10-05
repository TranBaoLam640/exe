import { useEffect, useState } from 'react';
import api from '../config/api.js';

function EvidenceImage({ id, label }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let objectUrl;
    setUrl('');
    setError(false);
    api.get(`/api/evidence/${id}`, { responseType: 'blob' }).then(({ data }) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(data);
      setUrl(objectUrl);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, retry]);
  if (!url) return <div className="evidence-image-placeholder" role="status"><span>{error ? 'Không thể tải ảnh.' : 'Đang tải ảnh...'}</span>{error ? <button type="button" onClick={() => setRetry((value) => value + 1)}>Thử lại</button> : null}</div>;
  return <a className="evidence-image" href={url} target="_blank" rel="noreferrer"><img alt={label} src={url} /><span>{label}</span></a>;
}

export default function EvidenceGallery({ ids = [], label = 'Ảnh bằng chứng' }) {
  if (!ids.length) return null;
  return <div className="evidence-gallery">{ids.map((id, index) => <EvidenceImage id={id} key={id} label={`${label} ${index + 1}`} />)}</div>;
}
