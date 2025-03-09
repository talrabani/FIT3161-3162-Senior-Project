import React from 'react';

type Props = {
    children: React.ReactNode;
    className?: string;
    title?: string;
};

export function TypographyH1({ children, className = '' }: Props) {
    return (
        <h1 className={`display-4 fw-bold ${className}`}>
            {children}
        </h1>
    );
}

export function TypographyH2({ children, className = '' }: Props) {
    return (
        <h2 className={`display-5 fw-semibold ${className}`}>
            {children}
        </h2>
    );
}

export function TypographyH3({ children, className = '' }: Props) {
    return (
        <h3 className={`display-6 fw-semibold ${className}`}>
            {children}
        </h3>
    );
}

export function TypographyH4({ children, className = '' }: Props) {
    return (
        <h4 className={`h4 fw-semibold ${className}`}>
            {children}
        </h4>
    );
}

export function TypographyH5({ children, className = '' }: Props) {
    return (
        <h5 className={`h5 fw-semibold ${className}`}>
            {children}
        </h5>
    );
}

export function TypographyComponentsOnlyLarge({ children, className = '' }: Props) {
    return (
        <p className={`fs-4 fw-semibold ${className}`}>
            {children}
        </p>
    );
}

export function TypographyP({ children, className = '', title }: Props) {
    return (
        <p title={title} className={`${className}`}>
            {children}
        </p>
    );
}

export function TypographyPBold({ children, className = '' }: Props) {
    return (
        <p className={`fw-semibold ${className}`}>
            {children}
        </p>
    );
}

export function TypographyP2({ children, className = '' }: Props) {
    return (
        <p className={`small ${className}`}>
            {children}
        </p>
    );
}

export function TypographyP2Bold({ children, className = '' }: Props) {
    return (
        <p className={`small fw-semibold ${className}`}>
            {children}
        </p>
    );
}

export function TypographyCaption({ children, className = '' }: Props) {
    return (
        <p className={`small text-muted ${className}`}>
            {children}
        </p>
    );
}

export function TypographyCaptionBold({ children, className = '' }: Props) {
    return (
        <p className={`small fw-semibold text-muted ${className}`}>
            {children}
        </p>
    );
}

export function TypographyLarge({ children, className = '' }: Props) {
    return <div className={`fs-4 fw-semibold ${className}`}>{children}</div>;
}

export function TypographySmall({ children, className = '' }: Props) {
    return (
        <small className={`${className}`}>
            {children}
        </small>
    );
}

export function TypographyMuted({ children, className = '' }: Props) {
    return <p className={`text-muted small ${className}`}>{children}</p>;
}

export function TypographyLink1({ children, className = '' }: Props) {
    return (
        <p className={`fw-semibold text-primary ${className}`}>
            {children}
        </p>
    );
}

export function TypographyLink2({ children, className = '' }: Props) {
    return (
        <p className={`small fw-semibold text-primary ${className}`}>
            {children}
        </p>
    );
}

export function TypographyLink3({ children, className = '' }: Props) {
    return (
        <p className={`small fw-semibold text-primary fst-italic ${className}`}>
            {children}
        </p>
    );
}

export function UserData({ children, className = '' }: Props) {
    return <span className={className}>{children}</span>;
}

export function TypographyFootNote({ children, className = '' }: Props) {
    return (
        <p className={`small text-muted ${className}`}>
            {children}
        </p>
    );
}

export function TypographyFootNoteBold({ children, className = '' }: Props) {
    return (
        <p className={`small fw-semibold text-muted ${className}`}>
            {children}
        </p>
    );
}

// For compatibility with existing code
export const H1 = TypographyH1;
export const H2 = TypographyH2;
export const H3 = TypographyH3;
export const H4 = TypographyH4;
export const P = TypographyP;
export const Muted = TypographyMuted; 