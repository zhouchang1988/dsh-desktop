import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = path.resolve(import.meta.dirname, '..')

function patchPath(name: string): string {
  return path.join(projectRoot, 'patches', name)
}

function bundlePath(pkg: string): string {
  return path.join(projectRoot, 'node_modules', '@deepseek-ai', pkg, 'lib', 'client.js')
}

const localePatch = '@deepseek-ai+dsh-client-locale+0.1.0-rc.8.patch'

describe('DSH Desktop language selector', () => {
  it('offers Auto, 简体中文, 繁體中文 and English', async () => {
    const patch = await readFile(patchPath(localePatch), 'utf8')

    expect(patch).toContain('label: "简体中文"')
    expect(patch).toContain('label: "繁體中文"')
    expect(patch).toContain('label: "English"')
    expect(patch).toContain('"language.auto": "自动检测"')
    expect(patch).toContain('"language.auto": "Auto"')
    expect(patch).toContain('id: "auto"')
  })

  it('registers zh-Hant in both the browser client and the host schema', async () => {
    const patch = await readFile(patchPath(localePatch), 'utf8')

    expect(patch).toContain('const LOCALE_IDS = ["zh", "zh-Hant", "en"];')
    expect(patch).toContain('id: "zh-Hant"')
  })

  it('clears the durable preference for the Auto option', async () => {
    const patch = await readFile(patchPath(localePatch), 'utf8')

    expect(patch).toContain('setAuto()')
    expect(patch).toContain('this.host?.unset(LOCALE_PREFERENCE_FIELD)')
    expect(patch).toContain('locale.setAuto()')
  })

  it('maps traditional browser locales to zh-Hant', async () => {
    const patch = await readFile(patchPath(localePatch), 'utf8')

    expect(patch).toContain('hant')
    expect(patch).toContain('tw|hk|mo')
  })

  it('derives zh-Hant dictionaries from zh at registration time', async () => {
    const patch = await readFile(patchPath(localePatch), 'utf8')

    expect(patch).toContain('S2T_CHARS')
    expect(patch).toContain('S2T_PHRASES')
    expect(patch).toContain('function toTraditional(text)')
    expect(patch).toContain('pairs.push(["zh-Hant"')
  })

  it('is applied to the installed bundle', async () => {
    const client = await readFile(bundlePath('dsh-client-locale'), 'utf8')

    expect(client).toContain('label: "繁體中文"')
    expect(client).toContain('"language.auto": "自动检测"')
    expect(client).toContain('function toTraditional(text)')
    expect(client).toContain('setAuto()')

    const index = await readFile(
      path.join(
        projectRoot,
        'node_modules',
        '@deepseek-ai',
        'dsh-client-locale',
        'lib',
        'index.js'
      ),
      'utf8'
    )
    expect(index).toContain('const LOCALE_IDS = ["zh", "zh-Hant", "en"];')
  })
})

describe('zh dictionary mixed-language fixes', () => {
  it('translates the Cordis panel zh copy', async () => {
    const patch = await readFile(
      patchPath('@deepseek-ai+dsh-client-ui-cordis+0.1.0-rc.8.patch'),
      'utf8'
    )

    expect(patch).toContain('"panel.trigger": "Cordis 插件"')
    expect(patch).toContain('"panel.runningCount": "{count} 个运行中"')
    expect(patch).toContain('"body.hostCode": "宿主"')
    expect(patch).toContain('"body.clientCode": "客户端"')
  })

  it('translates the reasoning-effort default label', async () => {
    const patch = await readFile(
      patchPath('@deepseek-ai+dsh-client-ui-model-selection+0.1.0-rc.8.patch'),
      'utf8'
    )

    expect(patch).toContain('"effort.providerDefault": "默认"')
  })

  it('translates the provider ID label in the models settings', async () => {
    const patch = await readFile(
      patchPath('@deepseek-ai+dsh-client-ui-settings-models+0.1.0-rc.8.patch'),
      'utf8'
    )

    expect(patch).toContain('customRoute: "提供方 ID"')
  })

  it('translates the Awesome preset entry zh copy', async () => {
    const patch = await readFile(
      patchPath('@deepseek-ai+dsh-client-ui-agent-preset+0.1.0-rc.8.patch'),
      'utf8'
    )

    expect(patch).toContain('awesomePreset: "Awesome 预设"')
  })

  it('localizes the trajectory panel through tPanel', async () => {
    const patch = await readFile(
      patchPath('@deepseek-ai+dsh-client-ui-trajectory+0.1.0-rc.8.patch'),
      'utf8'
    )

    expect(patch).toContain('let tPanel = (key) => key;')
    expect(patch).toContain('tPanel = t;')
    expect(patch).toContain('"timing.totalDuration": "总时长"')
    expect(patch).toContain('"nav.toolCall": "工具调用"')
    expect(patch).toContain('"timeline.noData": "暂无计时数据"')
    expect(patch).toContain('"toolbar.collapseTurns": "收起轮次"')
  })
})
