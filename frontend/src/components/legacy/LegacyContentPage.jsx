import { useEffect, useRef, useState } from 'react';
import { imageUrl } from '../../assets/imageUrl.js';

function rewriteImages(container) {
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(src) || src.startsWith('data:')) return;
    img.setAttribute('src', imageUrl(src));
  });
}

function stripLegacyShell(doc) {
  const body = doc.body.cloneNode(true);
  body.querySelectorAll('header, footer, script').forEach((node) => node.remove());
  rewriteImages(body);
  return body.innerHTML;
}

export default function LegacyContentPage({ className, source, title, behavior = 'static' }) {
  const ref = useRef(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    document.title = title;

    fetch(source)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${source}`);
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(text, 'text/html');
        setHtml(stripLegacyShell(doc));
      })
      .catch(() => {
        if (!cancelled) setHtml('');
      });

    return () => {
      cancelled = true;
    };
  }, [source, title]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll('.fade-in').forEach((element) => observer.observe(element));

    const onClick = (event) => {
      const faqButton = event.target.closest('.faq-question, .faq-q');
      if (!faqButton || !root.contains(faqButton)) return;
      event.preventDefault();
      const item = faqButton.closest('.faq-item');
      if (!item) return;

      if (behavior === 'contact') {
        const wasOpen = item.classList.contains('open');
        root.querySelectorAll('.faq-item').forEach((faq) => {
          faq.classList.remove('open');
          faq.querySelector('button')?.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('open');
          faqButton.setAttribute('aria-expanded', 'true');
        }
      } else if (behavior === 'tutorial') {
        item.classList.toggle('open');
        faqButton.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
      }
    };

    const onSubmit = (event) => {
      if (behavior !== 'contact') return;
      const form = event.target.closest('form');
      if (!form || !root.contains(form)) return;
      event.preventDefault();
      const message = root.querySelector('#successMsg');
      if (message) message.style.display = 'block';
      form.reset();
    };

    root.querySelectorAll('.faq-item button').forEach((button) => {
      button.setAttribute('aria-expanded', button.closest('.faq-item')?.classList.contains('open') ? 'true' : 'false');
    });
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);

    return () => {
      observer.disconnect();
      root.removeEventListener('click', onClick);
      root.removeEventListener('submit', onSubmit);
    };
  }, [html, behavior]);

  return <div className={className} ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
