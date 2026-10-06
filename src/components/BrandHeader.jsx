import { ArrowBack } from './Icons'

export default function BrandHeader({ onBack, onMenu, hideBack = false }) {
  return (
    <header className={`brand-header${hideBack ? ' home-header' : ''}`}>
      {hideBack ? (
        <span className="header-spacer" aria-hidden="true" />
      ) : (
        <button className="header-icon-button back" onClick={onBack} aria-label="חזרה">
          <ArrowBack />
        </button>
      )}

      <img
        className="header-logo"
        src="./logo.png"
        alt="גן מקסים"
        style={hideBack ? { width: '140px', height: '68px' } : undefined}
      />

      <button className="header-icon-button" onClick={onMenu} aria-label="פרופיל">
        <img
          src="./profile-icon.png"
          alt="פרופיל"
          style={hideBack
            ? { width: '48px', height: '48px', objectFit: 'contain' }
            : { width: '42px', height: '42px', objectFit: 'contain' }}
        />
      </button>
    </header>
  )
}
