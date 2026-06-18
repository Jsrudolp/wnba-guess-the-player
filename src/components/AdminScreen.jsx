import { useState, useMemo, useEffect, useRef } from 'react'

const PASSWORD = 'WNBA1'
const SESSION_KEY = 'admin_auth'

const TEAMS = [
  'Atlanta Dream', 'Chicago Sky', 'Connecticut Sun', 'Dallas Wings',
  'Golden State Valkyries', 'Indiana Fever', 'Las Vegas Aces',
  'Los Angeles Sparks', 'Minnesota Lynx', 'New York Liberty',
  'Phoenix Mercury', 'Seattle Storm', 'Washington Mystics',
]

function LoginGate({ onAuth }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-box">
        <div className="admin-login-eyebrow">Admin</div>
        <h1 className="admin-login-title">Player Roster</h1>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="password"
            className={`admin-login-input${error ? ' error' : ''}`}
            placeholder="Password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            autoFocus
          />
          {error && <p className="admin-login-error">Incorrect password</p>}
          <button type="submit" className="admin-login-btn">Enter</button>
        </form>
      </div>
    </div>
  )
}

function PhotoThumb({ src, size = 44 }) {
  const [err, setErr] = useState(false)
  useEffect(() => setErr(false), [src])
  if (src && !err) {
    return (
      <img
        src={src}
        alt=""
        className="admin-thumb"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div className="admin-thumb-empty" style={{ width: size, height: size }}>
      <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="12" r="7" fill="currentColor"/>
        <path d="M4 32c0-7.7 6.3-14 14-14s14 6.3 14 14" fill="currentColor"/>
      </svg>
    </div>
  )
}

function EditRow({ player, onSave, onCancel, onDelete, isNew }) {
  const [draft, setDraft] = useState({ name: player.name, team: player.team, allStar: player.allStar })
  const [uploading, setUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(player.image || null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  function set(field, val) {
    setDraft(d => ({ ...d, [field]: val }))
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    if (isNew) return // photo uploaded on save for new players
    setUploading(true)
    const form = new FormData()
    form.append('photo', file)
    const res = await fetch(`/api/players/${player.id}/photo`, { method: 'POST', body: form })
    const data = await res.json()
    setPhotoPreview(data.image)
    setUploading(false)
  }

  async function handleSave() {
    if (!draft.name.trim()) return
    setSaving(true)
    const photoFile = fileRef.current?.files[0]
    await onSave(player.id, draft, isNew ? photoFile : null)
    setSaving(false)
  }

  return (
    <tr className="admin-row admin-row-editing">
      <td className="admin-td admin-td-photo">
        <div className="admin-photo-edit" onClick={() => fileRef.current.click()}>
          <PhotoThumb src={photoPreview} />
          <div className="admin-photo-overlay">
            {uploading ? '…' : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        </div>
      </td>
      <td className="admin-td admin-td-name">
        <input
          className="admin-edit-input"
          value={draft.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Player name"
          autoFocus={isNew}
        />
      </td>
      <td className="admin-td admin-td-team">
        <select
          className="admin-select admin-edit-select"
          value={draft.team}
          onChange={e => set('team', e.target.value)}
        >
          <option value="">Select team…</option>
          {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td className="admin-td admin-td-allstar">
        <button
          className={`admin-allstar-toggle${draft.allStar ? ' on' : ''}`}
          onClick={() => set('allStar', !draft.allStar)}
          type="button"
        >
          {draft.allStar ? 'All-Star' : '—'}
        </button>
      </td>
      <td className="admin-td admin-td-actions">
        <div className="admin-row-actions">
          <button
            className="admin-btn-save"
            onClick={handleSave}
            disabled={saving || !draft.name.trim()}
          >
            {saving ? '…' : 'Save'}
          </button>
          <button className="admin-btn-cancel" onClick={onCancel}>Cancel</button>
          {!isNew && (
            <button className="admin-btn-delete" onClick={() => onDelete(player.id)}>Delete</button>
          )}
        </div>
      </td>
    </tr>
  )
}

function ViewRow({ player, onEdit }) {
  return (
    <tr className="admin-row">
      <td className="admin-td admin-td-photo">
        <PhotoThumb src={player.image} />
      </td>
      <td className="admin-td admin-td-name">{player.name}</td>
      <td className="admin-td admin-td-team">{player.team}</td>
      <td className="admin-td admin-td-allstar">
        {player.allStar
          ? <span className="admin-badge admin-badge-yes">All-Star</span>
          : <span className="admin-badge admin-badge-no">—</span>}
      </td>
      <td className="admin-td admin-td-actions">
        <button className="admin-btn-edit" onClick={() => onEdit(player.id)}>Edit</button>
      </td>
    </tr>
  )
}

export default function AdminScreen() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [addingNew, setAddingNew] = useState(false)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [photoFilter, setPhotoFilter] = useState('all')
  const [allStarFilter, setAllStarFilter] = useState('all')

  useEffect(() => {
    if (!authed) return
    fetch('/api/players')
      .then(r => r.json())
      .then(data => { setPlayers(data); setLoading(false) })
  }, [authed])

  const allTeams = useMemo(() => [...new Set(players.map(p => p.team))].sort(), [players])

  const filtered = useMemo(() => {
    return players.filter(p => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false
      }
      if (teamFilter !== 'all' && p.team !== teamFilter) return false
      if (photoFilter === 'yes' && !p.image) return false
      if (photoFilter === 'no' && p.image) return false
      if (allStarFilter === 'yes' && !p.allStar) return false
      if (allStarFilter === 'no' && p.allStar) return false
      return true
    })
  }, [players, search, teamFilter, photoFilter, allStarFilter])

  const isFiltered = filtered.length !== players.length

  function clearFilters() {
    setSearch('')
    setTeamFilter('all')
    setPhotoFilter('all')
    setAllStarFilter('all')
  }

  async function handleSave(id, draft, photoFile) {
    if (addingNew && id.startsWith('__new')) {
      // Create new player
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const newPlayer = await res.json()
      // Upload photo if provided
      if (photoFile) {
        const form = new FormData()
        form.append('photo', photoFile)
        const pr = await fetch(`/api/players/${newPlayer.id}/photo`, { method: 'POST', body: form })
        const pd = await pr.json()
        newPlayer.image = pd.image
        await fetch(`/api/players/${newPlayer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: pd.image }),
        })
      }
      setPlayers(prev => [...prev, newPlayer])
      setAddingNew(false)
    } else {
      const res = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const updated = await res.json()
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
      setEditingId(null)
    }
  }

  async function handlePhotoSaved(id, imagePath) {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, image: imagePath } : p))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this player?')) return
    await fetch(`/api/players/${id}`, { method: 'DELETE' })
    setPlayers(prev => prev.filter(p => p.id !== id))
    setEditingId(null)
  }

  if (!authed) {
    return <LoginGate onAuth={() => setAuthed(true)} />
  }

  const allStarCount = players.filter(p => p.allStar).length

  return (
    <div className="admin">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-header-eyebrow">Admin</div>
          <h1 className="admin-header-title">Player Roster</h1>
        </div>
        <div className="admin-header-right">
          <div className="admin-stat">
            <span className="admin-stat-val">{players.length}</span>
            <span className="admin-stat-label">Players</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-val">{allStarCount}</span>
            <span className="admin-stat-label">All-Stars</span>
          </div>
          <a href="#" className="admin-back-btn">← Back to Game</a>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search by name or team…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select className="admin-select" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
          <option value="all">All Teams</option>
          {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select className="admin-select" value={photoFilter} onChange={e => setPhotoFilter(e.target.value)}>
          <option value="all">Any Photo</option>
          <option value="yes">Has Photo</option>
          <option value="no">No Photo</option>
        </select>

        <select className="admin-select" value={allStarFilter} onChange={e => setAllStarFilter(e.target.value)}>
          <option value="all">Any Status</option>
          <option value="yes">All-Stars Only</option>
          <option value="no">Non All-Stars</option>
        </select>

        <div className="admin-toolbar-right">
          <span className="admin-results-count">
            {isFiltered ? `${filtered.length} of ${players.length}` : `${players.length} players`}
          </span>
          {isFiltered && (
            <button className="admin-clear-btn" onClick={clearFilters}>Clear</button>
          )}
          <button
            className="admin-add-btn"
            onClick={() => { setAddingNew(true); setEditingId(null) }}
            disabled={addingNew}
          >
            + Add Player
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th admin-th-photo">Photo</th>
                <th className="admin-th admin-th-name">Name</th>
                <th className="admin-th admin-th-team">Team</th>
                <th className="admin-th admin-th-allstar">All-Star</th>
                <th className="admin-th admin-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {addingNew && (
                <EditRow
                  player={{ id: '__new', name: '', team: '', allStar: false, image: null }}
                  onSave={handleSave}
                  onCancel={() => setAddingNew(false)}
                  onDelete={() => {}}
                  isNew
                />
              )}
              {filtered.map(player =>
                editingId === player.id ? (
                  <EditRow
                    key={player.id}
                    player={player}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                    onDelete={handleDelete}
                    isNew={false}
                  />
                ) : (
                  <ViewRow
                    key={player.id}
                    player={player}
                    onEdit={setEditingId}
                  />
                )
              )}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && !addingNew && (
          <div className="admin-empty">No players match the current filters</div>
        )}
      </div>
    </div>
  )
}
