import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = path.resolve(import.meta.dirname, '..')

function patchPath(name: string): string {
  return path.join(projectRoot, 'patches', name)
}

const inputTriggerPatch = '@deepseek-ai+dsh-client-ui-input-trigger+0.1.0-rc.6.patch'

describe('slash command menu localization', () => {
  it('translates candidate descriptions through the menu dictionary', async () => {
    const patch = await readFile(patchPath(inputTriggerPatch), 'utf8')

    expect(patch).toContain('function itemDescription(t, source, item)')
    expect(patch).toContain('children: itemDescription(t, group.source, item)')
    expect(patch).toContain('return translated === key ? item.description : translated;')
  })

  it('registers zh and en copy for every shipped host command', async () => {
    const patch = await readFile(patchPath(inputTriggerPatch), 'utf8')

    const zh = [
      ['"item.command.compact": "压缩较早的对话历史"'],
      ['"item.command.permission": "切换权限预设（沙箱模式 + 审批策略）"'],
      ['"item.command.export": "下载本会话的日志（ZIP 压缩包）"'],
      ['"item.command.goal": "设置或查看长任务的目标"'],
      ['"item.command.feedback": "记录对本会话的反馈"'],
      ['"item.command.plan": "进入或退出计划模式"']
    ] as const
    const en = [
      ['"item.command.compact": "Compact older conversation history"'],
      ['"item.command.permission": "Switch the permission preset (sandbox mode + approval policy)"'],
      ['"item.command.export": "Download this Session log as a ZIP archive"'],
      ['"item.command.goal": "set or view the goal for a long-running task"'],
      ['"item.command.feedback": "record feedback about this session"'],
      ['"item.command.plan": "Enter or leave plan mode"']
    ] as const
    for (const [entry] of [...zh, ...en]) expect(patch).toContain(entry)
  })

  it('is applied to the installed bundle', async () => {
    const bundle = await readFile(
      path.join(
        projectRoot,
        'node_modules',
        '@deepseek-ai',
        'dsh-client-ui-input-trigger',
        'lib',
        'client.js'
      ),
      'utf8'
    )

    expect(bundle).toContain('function itemDescription(t, source, item)')
    expect(bundle).toContain('"item.command.compact": "压缩较早的对话历史"')
    expect(bundle).toContain('"item.command.plan": "Enter or leave plan mode"')
  })
})
