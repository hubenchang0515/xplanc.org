import { useCallback, useEffect, useState } from 'react'

function getColumnCount() {
  if (window.innerWidth > 1120) return 3
  return window.innerWidth >= 768 ? 2 : 1
}

function pageFor(visiblePortal: number | null, pageSize: number) {
  return visiblePortal === null ? 0 : Math.floor(visiblePortal / pageSize) + 1
}

export function useDeckPages(portalCount: number) {
  const [columns, setColumns] = useState(getColumnCount)
  const [visiblePortal, setVisiblePortal] = useState<number | null>(null)
  const pageSize = columns === 1 ? 1 : columns * 2
  const lastPage = Math.ceil(portalCount / pageSize)
  const page = Math.min(lastPage, pageFor(visiblePortal, pageSize))

  useEffect(() => {
    function updateColumns() {
      setColumns(getColumnCount())
    }

    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  const setPage = useCallback((requested: number | ((current: number) => number)) => {
    setVisiblePortal((current) => {
      const currentPage = Math.min(lastPage, pageFor(current, pageSize))
      const next = typeof requested === 'function' ? requested(currentPage) : requested
      const nextPage = Math.max(0, Math.min(lastPage, next))
      if (nextPage === currentPage) return current
      return nextPage === 0 ? null : (nextPage - 1) * pageSize
    })
  }, [lastPage, pageSize])

  const turnPage = useCallback((direction: number) => {
    setPage((current) => current + direction)
  }, [setPage])

  useEffect(() => {
    let lastWheelAt = -Infinity
    let wheelDirection = 0
    let wheelDistance = 0
    let wheelHandled = false
    let touchOrigin: Touch | undefined

    function handleWheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const now = performance.now()
      const direction = Math.sign(event.deltaY)
      if (now - lastWheelAt > 180 || direction !== wheelDirection) {
        wheelDirection = direction
        wheelDistance = 0
        wheelHandled = false
      }
      lastWheelAt = now
      if (wheelHandled) return

      wheelDistance += Math.abs(event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 600 : 1)
      if (wheelDistance < 16) return

      wheelHandled = true
      turnPage(direction)
    }

    function handleTouchStart(event: TouchEvent) {
      touchOrigin = event.touches.length === 1 ? event.touches[0] : undefined
    }

    function handleTouchEnd(event: TouchEvent) {
      if (!touchOrigin) return

      const start = touchOrigin
      touchOrigin = undefined
      const end = event.changedTouches[0]
      if (!end || end.identifier !== start.identifier) return

      const x = start.clientX - end.clientX
      const y = start.clientY - end.clientY
      if (Math.abs(y) >= 36 && Math.abs(y) > Math.abs(x)) turnPage(Math.sign(y))
    }

    function cancelTouch() {
      touchOrigin = undefined
    }

    function handleKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return

      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        turnPage(1)
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        turnPage(-1)
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        setPage(event.key === 'Home' ? 0 : lastPage)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', cancelTouch, { passive: true })
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', cancelTouch)
      window.removeEventListener('keydown', handleKey)
    }
  }, [lastPage, setPage, turnPage])

  return { page, lastPage, pageSize, columns, setPage, turnPage }
}
