import { Link } from 'react-router-dom';
import { Button, EmptyState } from '../components/ui';

export function NotFoundPage() {
  return (
    <EmptyState
      title="No such page"
      body="The link you followed does not match a route in this app."
      action={
        <Link to="/drill">
          <Button variant="secondary" size="sm">
            Back to the drill
          </Button>
        </Link>
      }
    />
  );
}
