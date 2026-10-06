import { ArrowBack } from './Icons'

export default function BrandHeader({ onBack, onMenu, hideBack = false }) {
  return (
    <header className={`brand-header${hideBack ? ' home-header' : ''}`}>
      {!hideBack && (
        <button className="header-icon-button back" onClick={onBack} aria-label="חזרה">
          <ArrowBack />
        </button>
      )}

      <img
        className="header-logo"
        src="./logo.png"
        alt="גן מקסים"
        style={{ width: '110px', height: 'auto' }}
      />

      <button className="header-icon-button" onClick={onMenu} aria-label="פרופיל">
        <img
          src="./profile-icon.png"
          alt="פרופיל"
          style={{ width: '42px', height: '42px', objectFit: 'contain' }}
        />
      </button>
    </header>
  )
}
