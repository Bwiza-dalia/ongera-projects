import { type InputHTMLAttributes, useId, useState } from 'react';
import { IconEye, IconEyeOff } from './NavIcons';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  wrapClassName?: string;
  toggleClassName?: string;
};

export function PasswordInput({
  wrapClassName = 'auth-form__password-wrap',
  toggleClassName = 'auth-form__toggle',
  className = 'auth-form__input',
  id,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <div className={wrapClassName}>
      <input
        {...inputProps}
        id={inputId}
        className={className}
        type={visible ? 'text' : 'password'}
      />
      <button
        type="button"
        className={toggleClassName}
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        {visible ? <IconEyeOff size={20} /> : <IconEye size={20} />}
      </button>
    </div>
  );
}
