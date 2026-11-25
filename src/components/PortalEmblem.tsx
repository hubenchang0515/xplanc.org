export function PortalEmblem({ iconUrl }: { iconUrl: string }) {
  return (
    <div className="card-emblem" aria-hidden="true">
      <img src={iconUrl} alt="" width={24} height={24} />
    </div>
  )
}
