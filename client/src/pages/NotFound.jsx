import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="screen-center">
      <p className="mono accent big">404</p>
      <p className="dim">This page doesn't exist.</p>
      <Link to="/" className="btn btn-ghost">Go home</Link>
    </div>
  );
}
