import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-teal-400/30 bg-slate-950 text-teal-300 shadow-sm focus:ring-teal-300 focus:ring-offset-slate-950 ' +
                className
            }
        />
    );
}
