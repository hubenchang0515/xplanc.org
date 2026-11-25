import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: number
  text: string
}

interface ToastStackProps {
  messages: ToastMessage[]
  onDismiss: (id: number) => void
}

function Toast({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    const hideTimer = window.setTimeout(() => setVisible(false), 2000)
    const dismissTimer = window.setTimeout(() => onDismiss(message.id), 2260)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(hideTimer)
      window.clearTimeout(dismissTimer)
    }
  }, [message.id, onDismiss])

  return (
    <div className={visible ? 'holo-toast show' : 'holo-toast'}>
      <span className="dot" />
      <span>{message.text}</span>
    </div>
  )
}

export function ToastStack({ messages, onDismiss }: ToastStackProps) {
  return (
    <div id="toast-stack" className="toast-stack" aria-live="polite">
      {messages.map((message) => <Toast key={message.id} message={message} onDismiss={onDismiss} />)}
    </div>
  )
}
