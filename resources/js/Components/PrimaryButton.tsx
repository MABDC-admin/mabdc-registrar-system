import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `ops-button-primary inline-flex items-center rounded-md px-4 py-2 text-xs font-black uppercase tracking-widest transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-300/70 focus:ring-offset-2 focus:ring-offset-slate-950 active:scale-[0.99] ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
