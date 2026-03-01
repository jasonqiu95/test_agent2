export interface UnsavedChangesWarningProps {
  hasUnsavedChanges: boolean
  onSave: () => void
  onDiscard: () => void
}

export function UnsavedChangesWarning({
  hasUnsavedChanges,
  onSave,
  onDiscard,
}: UnsavedChangesWarningProps) {
  if (!hasUnsavedChanges) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff3cd',
        borderBottom: '2px solid #ffc107',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
            fill="#856404"
          />
        </svg>
        <span style={{ color: '#856404', fontWeight: 500 }}>
          You have unsaved changes
        </span>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onSave}
          style={{
            padding: '6px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Save
        </button>
        <button
          onClick={onDiscard}
          style={{
            padding: '6px 16px',
            backgroundColor: 'transparent',
            color: '#856404',
            border: '1px solid #856404',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Discard
        </button>
      </div>
    </div>
  )
}
