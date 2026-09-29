import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-2 pt-1 text-sm font-bold leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-teal-300 text-teal-100 drop-shadow-[0_0_12px_rgba(45,212,191,0.35)] focus:border-teal-200'
                    : 'border-transparent text-slate-400 hover:border-teal-400/50 hover:text-slate-100 focus:border-teal-400/50 focus:text-slate-100') +
                className
            }
        >
            {children}
        </Link>
    );
}
