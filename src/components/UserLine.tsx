import { Avatar } from './ui'
import { timeAgo } from '../lib/format'

interface Props {
  name?: string | null
  avatarUrl?: string | null
  date: string
  size?: 'sm' | 'md'
  className?: string
}

// "avatar + @username · timeAgo" header used by every moderation page.
export function UserLine({ name, avatarUrl, date, size = 'md', className = '' }: Props) {
  const text = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <div className={`flex items-center gap-2 ${text} text-zinc-500 dark:text-zinc-400 ${className}`}>
      <Avatar name={name} url={avatarUrl} />
      <span>@{name ?? 'desconocido'}</span>
      <span>·</span>
      <span>{timeAgo(date)}</span>
    </div>
  )
}