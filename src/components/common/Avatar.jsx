/**
 * Avatar — shows the user's uploaded picture when present, otherwise a colored
 * circle with their initial. Works for the current user and for friends.
 */
export default function Avatar({ user, size = 40, className = '' }) {
  const dims = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  const initial = ((user?.name || '?').trim()[0] || '?').toUpperCase();

  if (user?.avatarUrl) {
    return (
      <div className={`avatar has-img ${className}`.trim()} style={dims}>
        <img src={user.avatarUrl} alt={user?.name || 'avatar'} />
      </div>
    );
  }
  return (
    <div className={`avatar ${className}`.trim()} style={{ ...dims, background: user?.avatarColor || 'var(--brand)' }}>
      {initial}
    </div>
  );
}
