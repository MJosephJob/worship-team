import { apiFetch } from './api'

export const BADGE_DEFINITIONS = [
  { key: 'welcome',       emoji: '🎉', name: 'Welcome!',            description: 'Account created' },
  { key: 'onboarded',     emoji: '✅', name: 'Onboarded',           description: 'Completed full onboarding' },
  { key: '3months',       emoji: '🌱', name: '3 Months Faithful',   description: '3 months of membership' },
  { key: '6months',       emoji: '🌿', name: 'Half Year Strong',    description: '6 months of membership' },
  { key: '1year',         emoji: '🌟', name: '1 Year Devoted',      description: '1 year of membership' },
  { key: '2years',        emoji: '👑', name: '2 Years Legacy',      description: '2 years of membership' },
  { key: 'consistent',    emoji: '🎵', name: 'Consistent Worshipper', description: '20+ events attended' },
  { key: 'prayerwarrior', emoji: '🙏', name: 'Prayer Warrior',      description: '10+ prayer requests posted' },
  { key: 'answered',      emoji: '🕊️', name: 'Answered!',           description: 'First answered prayer recorded' },
  { key: 'reviewer',      emoji: '📖', name: 'Monthly Reviewer',    description: '6 consecutive monthly V&M reviews' },
  { key: 'encourager',    emoji: '💌', name: 'Encourager',          description: 'Sent 10+ encouragement notes' },
]

export async function checkAndAwardBadges(member, stats) {
  const existing = (stats.badges || []).map(b => b.badgeKey)
  const toAward = []

  const joinDate = new Date(member.joinDate)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())

  if (!existing.includes('welcome')) toAward.push('welcome')
  if (member.isOnboarded && !existing.includes('onboarded')) toAward.push('onboarded')
  if (monthsDiff >= 3 && !existing.includes('3months')) toAward.push('3months')
  if (monthsDiff >= 6 && !existing.includes('6months')) toAward.push('6months')
  if (monthsDiff >= 12 && !existing.includes('1year')) toAward.push('1year')
  if (monthsDiff >= 24 && !existing.includes('2years')) toAward.push('2years')
  if ((stats.attendanceCount || 0) >= 20 && !existing.includes('consistent')) toAward.push('consistent')
  if ((stats.prayerPostCount || 0) >= 10 && !existing.includes('prayerwarrior')) toAward.push('prayerwarrior')
  if ((stats.answeredCount || 0) >= 1 && !existing.includes('answered')) toAward.push('answered')
  if ((stats.vmStreak || 0) >= 6 && !existing.includes('reviewer')) toAward.push('reviewer')
  if ((stats.encouragementCount || 0) >= 10 && !existing.includes('encourager')) toAward.push('encourager')

  for (const key of toAward) {
    const def = BADGE_DEFINITIONS.find(b => b.key === key)
    if (def) {
      try {
        await apiFetch('awardBadge', {
          memberId: member.id,
          badgeKey: key,
          badgeName: def.name,
          badgeEmoji: def.emoji,
          isCustom: false,
        })
      } catch (badgeErr) {
        console.error('Badge award failed for badge:', key, badgeErr)
        // continue to next badge
      }
    }
  }

  return toAward
}
