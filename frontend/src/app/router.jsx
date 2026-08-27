import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import { PolicyPage, TermsPage } from '../pages/LegalPages.jsx';
import NewsDetailPage from '../pages/NewsDetailPage.jsx';
import NewsPage from '../pages/NewsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import TutorialPage from '../pages/TutorialPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
      {
        path: 'policy',
        element: <PolicyPage />,
      },
      {
        path: 'terms',
        element: <TermsPage />,
      },
      {
        path: 'tutorial',
        element: <TutorialPage />,
      },
      {
        path: 'news',
        element: <NewsPage />,
      },
      {
        path: 'news_detail',
        element: <NewsDetailPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
