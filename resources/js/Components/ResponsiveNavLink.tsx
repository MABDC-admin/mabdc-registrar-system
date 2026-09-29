import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-teal-300 bg-teal-400/10 text-teal-100 focus:border-teal-200 focus:bg-teal-400/15'
                    : 'border-transparent text-slate-400 hover:border-teal-400/40 hover:bg-slate-900 hover:text-slate-100 focus:border-teal-400/40 focus:bg-slate-900 focus:text-slate-100'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
