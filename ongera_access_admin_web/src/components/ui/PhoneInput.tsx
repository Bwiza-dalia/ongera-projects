import { useEffect, useId, useRef, useState } from 'react';
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  digitsOnly,
  formatPhoneValue,
  getPhoneCountry,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from '../../lib/phoneCountries';

type PhoneInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
};

export function PhoneInput({
  id,
  value,
  onChange,
  disabled,
  placeholder = '7XX XXX XXX',
  'aria-label': ariaLabel,
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-countries`;
  const rootRef = useRef<HTMLDivElement>(null);

  const initial = parsePhoneValue(value);
  const [countryIso, setCountryIso] = useState(initial.iso || DEFAULT_PHONE_COUNTRY_ISO);
  const [national, setNational] = useState(initial.national);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setNational('');
      return;
    }
    const next = parsePhoneValue(value);
    setCountryIso(next.iso);
    setNational(next.national);
  }, [value]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const country = getPhoneCountry(countryIso);

  function emit(nextIso: string, nextNational: string) {
    onChange(formatPhoneValue(getPhoneCountry(nextIso).dial, nextNational));
  }

  function selectCountry(nextIso: string) {
    setCountryIso(nextIso);
    if (national) emit(nextIso, national);
    setMenuOpen(false);
  }

  return (
    <div className="admin-page__phone" ref={rootRef}>
      <div className="admin-page__phone-flag-wrap">
        <button
          type="button"
          className="admin-page__phone-flag-btn"
          disabled={disabled}
          aria-label={`${country.name} (+${country.dial})`}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          aria-controls={listboxId}
          title={`${country.name} (+${country.dial})`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="admin-page__phone-flag" aria-hidden="true">
            {country.flag}
          </span>
          <span className="admin-page__phone-chevron" aria-hidden="true">
            ▾
          </span>
        </button>

        {menuOpen && (
          <ul
            id={listboxId}
            className="admin-page__phone-menu"
            role="listbox"
            aria-label="Country"
          >
            {PHONE_COUNTRIES.map((c) => (
              <li key={c.iso} role="presentation">
                <button
                  type="button"
                  role="option"
                  className={
                    c.iso === countryIso
                      ? 'admin-page__phone-option is-selected'
                      : 'admin-page__phone-option'
                  }
                  aria-selected={c.iso === countryIso}
                  aria-label={`${c.name} (+${c.dial})`}
                  onClick={() => selectCountry(c.iso)}
                >
                  <span className="admin-page__phone-option-flag" aria-hidden="true">
                    {c.flag}
                  </span>
                  <span className="admin-page__phone-option-name">{c.name}</span>
                  <span className="admin-page__phone-option-code">+{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className="admin-page__phone-dial" aria-hidden="true">
        +{country.dial}
      </span>

      <input
        id={inputId}
        className="admin-page__input admin-page__phone-number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        pattern="[0-9]*"
        placeholder={placeholder}
        value={national}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Phone number'}
        onChange={(e) => {
          const nextNational = digitsOnly(e.target.value).slice(0, 15);
          setNational(nextNational);
          emit(countryIso, nextNational);
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text').trim();
          if (!text) return;
          e.preventDefault();
          if (text.startsWith('+') || digitsOnly(text).length > 10) {
            const next = parsePhoneValue(text);
            setCountryIso(next.iso);
            setNational(next.national);
            emit(next.iso, next.national);
            return;
          }
          const nextNational = digitsOnly(text).slice(0, 15);
          setNational(nextNational);
          emit(countryIso, nextNational);
        }}
      />
    </div>
  );
}
