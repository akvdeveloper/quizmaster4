import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './contexts/QuizContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CreateQuizPage from './pages/CreateQuizPage';
import QuizLobbyPage from './pages/QuizLobbyPage';
import QuizPlayPage from './pages/QuizPlayPage';
import ResultsPage from './pages/ResultsPage';
import JoinQuizPage from './pages/JoinQuizPage';
import NotFoundPage from './pages/NotFoundPage';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1 className="text-center text-red-500">Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ThemeProvider>
      <QuizProvider>
        <SocketProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create" element={<CreateQuizPage />} />
                    <Route path="/lobby/:quizId" element={<QuizLobbyPage />} />
                    <Route path="/play/:sessionId" element={<QuizPlayPage />} />
                    <Route path="/results/:sessionId" element={<ResultsPage />} />
                    <Route path="/join" element={<JoinQuizPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </ErrorBoundary>
              </main>
              <Footer />
            </div>
          </Router>
        </SocketProvider>
      </QuizProvider>
    </ThemeProvider>
  );
}

export default App;