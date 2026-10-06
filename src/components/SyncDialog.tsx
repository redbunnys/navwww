import { CloudDownload, CloudUpload, GitMerge } from 'lucide-react'
import { Button, Modal } from './Modal'

export type SyncMode = 'merge' | 'cloud' | 'local'

const OPTIONS = [
  {
    mode: 'merge' as const,
    icon: GitMerge,
    title: '合并两边数据',
    desc: '分类和书签取并集，同一个书签保留最近修改的版本',
  },
  {
    mode: 'cloud' as const,
    icon: CloudDownload,
    title: '只用云端数据',
    desc: '用云端覆盖本机，本机现有的书签会被替换',
  },
  {
    mode: 'local' as const,
    icon: CloudUpload,
    title: '用本地覆盖云端',
    desc: '把本机数据上传到云端，云端现有数据会被替换',
  },
]

export function SyncDialog({
  open,
  hasCloudData,
  busy,
  onChoose,
  onClose,
}: {
  open: boolean
  hasCloudData: boolean
  busy: SyncMode | null
  onChoose: (mode: SyncMode) => void
  onClose: () => void
}) {
  const options = OPTIONS.filter((option) => option.mode !== 'cloud' || hasCloudData)

  return (
    <Modal
      open={open}
      title="本机与云端数据不一致"
      width="max-w-xl"
      onClose={onClose}
      footer={
        <>
          <div className="mr-auto text-xs text-neutral-400">稍后再说会先使用云端数据</div>
          <Button onClick={onClose}>稍后再说</Button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {hasCloudData ? '本机和云端都有数据，请选择这次登录后怎么处理：' : '云端还没有数据，可以把本机数据上传上去：'}
        </p>
        {options.map((option) => (
          <button
            key={option.mode}
            type="button"
            disabled={busy !== null}
            onClick={() => onChoose(option.mode)}
            className="flex w-full items-start gap-3 rounded-xl border border-black/5 p-3 text-left transition hover:border-blue-400 hover:bg-blue-500/5 disabled:opacity-60 dark:border-white/10"
          >
            <option.icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <span className="flex-1">
              <span className="block text-sm font-medium">
                {option.title}
                {busy === option.mode ? ' · 处理中…' : ''}
              </span>
              <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{option.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
