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

const conversationPatch = '@deepseek-ai+dsh-client-ui-conversation+0.1.0-rc.6.patch'
const permissionPresetsPatch = '@deepseek-ai+dsh-client-ui-permission-presets+0.1.0-rc.6.patch'

describe('permission preset label localization', () => {
  it('translates the in-session permission select labels', async () => {
    const patch = await readFile(patchPath(conversationPatch), 'utf8')

    expect(patch).toContain('function optionLabel(t, option)')
    expect(patch).toContain('"permission.preset.workspace-write": "工作区写入"')
    expect(patch).toContain('"permission.preset.danger-full-access": "Full access"')
    expect(patch).toContain('"permission.preset.read-only": "只读"')
    expect(patch).toContain('"permission.preset.workspace-write": "Workspace Write"')
    expect(patch).toContain('"permission.preset.read-only": "Read Only"')
  })

  it('translates the settings permission row option labels', async () => {
    const patch = await readFile(patchPath(permissionPresetsPatch), 'utf8')

    expect(patch).toContain('function presetOptionLabel(t, option)')
    expect(patch).toContain('label: presetOptionLabel(t, option)')
    expect(patch).toContain('"preset.workspace-write": "工作区写入"')
    expect(patch).toContain('"preset.danger-full-access": "Full access"')
    expect(patch).toContain('"preset.workspace-write": "Workspace Write"')
    expect(patch).toContain('"preset.custom": "Custom"')
  })

  it('translates the /permission popup options', async () => {
    const patch = await readFile(patchPath(permissionPresetsPatch), 'utf8')

    expect(patch).toContain('function accessPresetLabel(t, option)')
    expect(patch).toContain('label: accessPresetLabel(t, option)')
    expect(patch).toContain('return translated === key ? displayPermissionPreset(option.value, option.name) : translated;')
    expect(patch).toContain('"preset.workspace-write": accessZh["preset.workspace-write"]')
    expect(patch).toContain('"preset.workspace-write": accessEn["preset.workspace-write"]')
  })

  it('keeps host-configured custom names untouched when no translation exists', async () => {
    const patch = await readFile(patchPath(permissionPresetsPatch), 'utf8')

    expect(patch).toContain('return translated === key ? option.label : translated;')
  })

  it('is applied to the installed bundles', async () => {
    const conversation = await readFile(bundlePath('dsh-client-ui-conversation'), 'utf8')
    expect(conversation).toContain('function optionLabel(t, option)')
    expect(conversation).toContain('"permission.preset.workspace-write": "工作区写入"')

    const presets = await readFile(bundlePath('dsh-client-ui-permission-presets'), 'utf8')
    expect(presets).toContain('function presetOptionLabel(t, option)')
    expect(presets).toContain('"preset.workspace-write": "工作区写入"')
    expect(presets).toContain('function accessPresetLabel(t, option)')
    expect(presets).toContain('label: accessPresetLabel(t, option)')
  })
})

describe('main-process shell localization', () => {
  it('translates the application menu labels', async () => {
    const main = await readFile(path.join(projectRoot, 'src', 'main', 'index.ts'), 'utf8')

    expect(main).toContain("shellText('重启 Harness', '重新啟動 Harness', 'Restart Harness')")
    expect(main).toContain("'显示 Harness 日志'")
    expect(main).toContain("shellText('编辑', '編輯', 'Edit')")
    expect(main).toContain("shellText('显示', '顯示', 'View')")
    expect(main).toContain("shellText('窗口', '視窗', 'Window')")
  })

  it('pins Chromium locale from the system language for web auto-detection', async () => {
    const main = await readFile(path.join(projectRoot, 'src', 'main', 'index.ts'), 'utf8')

    expect(main).toContain('app.getPreferredSystemLanguages()')
    expect(main).toContain("app.commandLine.appendSwitch('lang'")
    expect(main).toContain('applySystemLocale()')
  })
})
