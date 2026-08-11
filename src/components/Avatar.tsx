import { cx } from '../lib/format';

type AvatarUser = {
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
};

/**
 * The user's picture, or their initial when there isn't one.
 *
 * `alt` is deliberately empty: the name is always rendered beside this, so
 * announcing it twice is noise. Google-hosted avatars occasionally fail to
 * load, which is why the initial is a real fallback rather than a placeholder
 * image.
 */
export function Avatar({
  user,
  /**
   * Carries the size. Deliberately not baked into the base class: a hardcoded
   * `size-*` there beats any override, because Tailwind resolves conflicts by
   * CSS source order rather than by the order classes appear in the attribute.
   */
  className = 'size-9 text-sm',
}: {
  user: AvatarUser;
  className?: string;
}) {
  const label = user.displayName?.trim() || user.email;

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className={cx('shrink-0 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent',
        className,
      )}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}
