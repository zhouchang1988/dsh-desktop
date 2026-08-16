import type { UpdateStatus } from '../shared/contracts'

export type UpdateLocale = 'en' | 'zh' | 'zh-Hant'

export function shouldShowUpdate(status: UpdateStatus): boolean {
  if (['available', 'downloading', 'downloaded'].includes(status.phase)) return true
  return status.manual && ['checking', 'up-to-date', 'error', 'unsupported'].includes(status.phase)
}

export function isUpdateDismissed(
  status: UpdateStatus,
  dismissedVersion: string | null,
  dismissedTransientPhase: UpdateStatus['phase'] | null = null
): boolean {
  if (status.availableVersion) return status.availableVersion === dismissedVersion
  return status.phase === dismissedTransientPhase
}

export function updateMessage(status: UpdateStatus, locale: UpdateLocale): string {
  const version = status.availableVersion ? ` ${status.availableVersion}` : ''
  const percent = Math.round(status.percent ?? 0)

  const messages: Record<UpdateStatus['phase'], Record<UpdateLocale, string>> = {
    checking: {
      en: 'Checking for updates…',
      zh: '正在检查更新…',
      'zh-Hant': '正在檢查更新…'
    },
    available: {
      en: `Update${version} is available. Preparing download…`,
      zh: `发现新版本${version}，正在准备下载…`,
      'zh-Hant': `發現新版本${version}，正在準備下載…`
    },
    downloading: {
      en: `Downloading update ${percent}%`,
      zh: `正在下载更新 ${percent}%`,
      'zh-Hant': `正在下載更新 ${percent}%`
    },
    downloaded: {
      en: `DSH Desktop${version} is ready to install`,
      zh: `DSH Desktop${version} 已下载完成`,
      'zh-Hant': `DSH Desktop${version} 已下載完成`
    },
    'up-to-date': {
      en: 'DSH Desktop is up to date',
      zh: 'DSH Desktop 已是最新版本',
      'zh-Hant': 'DSH Desktop 已是最新版本'
    },
    unsupported: {
      en: 'Automatic updates are unavailable in this build',
      zh: '当前版本不支持自动更新',
      'zh-Hant': '目前版本不支援自動更新'
    },
    error: {
      en: 'Unable to check for or download updates',
      zh: '无法检查或下载更新',
      'zh-Hant': '無法檢查或下載更新'
    },
    idle: { en: '', zh: '', 'zh-Hant': '' }
  }

  return messages[status.phase][locale]
}
