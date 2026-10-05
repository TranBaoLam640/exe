import { useEffect, useId, useState } from 'react';

export default function ReturnPhotoPicker({ files, onChange, disabled }) {
  const inputId = useId();
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [files]);

  return (
    <section className="return-photo-picker" aria-label="Ảnh tình trạng hàng khi trả">
      <div className="return-photo-heading">
        <div><h4>Ảnh tình trạng hàng</h4><p>Chụp rõ mặt trước, mặt sau và hư hỏng nếu có.</p></div>
        <span className={`return-photo-count${files.length >= 2 ? ' is-ready' : ''}`}>{files.length}/10 ảnh</span>
      </div>
      <label className={`return-photo-upload${disabled ? ' is-disabled' : ''}`} htmlFor={inputId}>
        <input id={inputId} className="return-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled} onChange={(event) => {
          const selected = Array.from(event.target.files || []);
          if (selected.length) onChange([...files, ...selected]);
          event.target.value = '';
        }} />
        <span className="return-photo-upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg></span>
        <strong>{files.length ? 'Thêm ảnh' : 'Chọn ảnh trả hàng'}</strong>
        <span>JPEG, PNG hoặc WebP · Tối đa 5 MB/ảnh</span>
      </label>
      {previews.length ? <div className="return-photo-previews">{previews.map(({ file, url }, index) => (
        <div className="return-photo-preview" key={`${file.name}-${index}`}>
          <img src={url} alt={`Ảnh trả hàng ${index + 1}: ${file.name}`} />
          <button className="return-photo-remove" type="button" disabled={disabled} aria-label={`Xóa ảnh ${index + 1}`} onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}>×</button>
          <span title={file.name}>{file.name}</span>
        </div>
      ))}</div> : null}
      <div className={`return-photo-requirement${files.length >= 2 ? ' is-ready' : ''}`} aria-live="polite">
        <span aria-hidden="true">{files.length >= 2 ? '✓' : 'ⓘ'}</span>
        {files.length >= 2 ? 'Đã đủ ảnh để gửi yêu cầu trả hàng.' : `Cần ít nhất 2 ảnh khác nhau${files.length ? ' — thêm 1 ảnh nữa để tiếp tục.' : '.'}`}
      </div>
    </section>
  );
}
