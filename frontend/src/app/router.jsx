import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import CartPage from '../pages/CartPage.jsx';
import ChatbotPage from '../pages/ChatbotPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import { PolicyPage, TermsPage } from '../pages/LegalPages.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import NewsDetailPage from '../pages/NewsDetailPage.jsx';
import NewsPage from '../pages/NewsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import OrdersPage from '../pages/OrdersPage.jsx';
import OrderTrackingPage from '../pages/OrderTrackingPage.jsx';
import ProductDetailPage from '../pages/ProductDetailPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ShopPage from '../pages/ShopPage.jsx';
import TutorialPage from '../pages/TutorialPage.jsx';
import TryOnPage from '../pages/TryOnPage.jsx';

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
        path: 'shop',
        element: <ShopPage />,
      },
      {
        path: 'cart',
        element: <CartPage />,
      },
      {
        path: 'chatbot',
        element: <ChatbotPage />,
      },
      {
        path: 'ai-tryon',
        element: <TryOnPage />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'orders/:orderId',
        element: <OrderTrackingPage />,
      },
      {
        path: 'product/:id',
        element: <ProductDetailPage />,
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
  {
    path: '/admin',
    element: <AdminPage />,
  },
]);
