import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RedirectIfAuthenticated, RequireAuth } from './auth/RequireAuth';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { RegisterPage } from './pages/RegisterPage';
import { DrillPage } from './pages/DrillPage';
import { DecksPage } from './pages/DecksPage';
import { DeckDetailPage } from './pages/DeckDetailPage';
import { AttemptPage } from './pages/AttemptPage';
import { SubmissionPage } from './pages/SubmissionPage';
import { ReviewPage } from './pages/ReviewPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public. Doubles as the signed-in landing, so it adapts rather than redirecting. */}
      <Route path="/" element={<HomePage />} />

      {/*
        Where OAUTH_SUCCESS_REDIRECT lands. Deliberately outside both guards:
        RequireAuth would bounce it to /login before the session is confirmed,
        and RedirectIfAuthenticated would skip straight past it on success,
        losing the error and cancellation states it exists to show.
      */}
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="drill" element={<DrillPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="decks" element={<DecksPage />} />
          <Route path="decks/:deckId" element={<DeckDetailPage />} />
          <Route path="problems/:problemId/attempt" element={<AttemptPage />} />
          <Route path="submissions/:submissionId" element={<SubmissionPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
