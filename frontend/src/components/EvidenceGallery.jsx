import { useEffect, useState } from 'react';
import api from '../config/api.js';

function EvidenceImage({ id, label }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
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
  }, [id]);
  if (!url) return <span>{error ? 'Không thể tải ảnh.' : 'Đang tải ảnh...'}</span>;
  return <a href={url} target="_blank" rel="noreferrer"><img alt={label} src={url} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} /></a>;
}

export default function EvidenceGallery({ ids = [], label = 'Ảnh bằng chứng' }) {
  if (!ids.length) return null;
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>{ids.map((id, index) => <EvidenceImage id={id} key={id} label={`${label} ${index + 1}`} />)}</div>;
}
