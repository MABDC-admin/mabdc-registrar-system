import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/logo.jpg"
            alt="MABDC Logo"
            className={`${className} rounded-full object-cover`}
            style={{ clipPath: 'circle(48.5% at 50% 50%)' }}
            {...props}
        />
    );
}
