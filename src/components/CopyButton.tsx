import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

async function copyText(text: string) {
  // 保留原版对不支持 Clipboard API 的页面的复制方式。
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)

  try {
    textarea.focus()
    textarea.select()
    if (document.execCommand('copy')) return true
  } catch {
    // 继续尝试 Clipboard API。
  } finally {
    textarea.remove()
  }

  try {
    if (!navigator.clipboard) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

interface CopyButtonProps {
  url: string
  name: string
  onNotify: (message: string) => void
}

export function CopyButton({ url, name, onNotify }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const latestAttempt = useRef(0)

  useEffect(() => () => {
    latestAttempt.current++
    window.clearTimeout(timer.current)
  }, [])

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    const attempt = ++latestAttempt.current
    const success = await copyText(url)
    if (attempt !== latestAttempt.current) return

    if (!success) {
      onNotify(`请手动复制 ${name} 地址`)
      return
    }

    onNotify(`COPIED ✓ ${url}`)
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1700)
  }

  return (
    <button
      type="button"
      className={copied ? 'copy-btn copied' : 'copy-btn'}
      data-copy-url={url}
      data-copy-name={name}
      data-interactive
      aria-label={`复制 ${name} 链接`}
      onClick={handleClick}
    >
      {copied ? 'COPIED ✓' : 'COPY'}
    </button>
  )
}
