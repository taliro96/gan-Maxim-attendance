import { ArrowBack, Menu } from './Icons'

export default function BrandHeader({ onBack, onMenu }) {
  return (
    <header className="brand-header">
      <button className="header-icon-button back" onClick={onBack} aria-label="חזרה">
        <ArrowBack />
      </button>

      <img className="header-logo" src="./logo.png" alt="גן מקסים" />

      <button className="header-icon-button" onClick={onMenu} aria-label="תפריט">
        <Menu />
      </button>
    </header>
  )
}
