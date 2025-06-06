import React from "react";
import clsx from "clsx";

const normalizeSvg = (raw: string, preserveColor: boolean = false): string => {
    let svg = raw
        .replace(/<\?xml[^>]*>/g, "") // remove XML declaration
        .replace(/<!DOCTYPE[^>]*>/g, "") // remove DOCTYPE
        .replace(/(width|height)="[^"]*"/g, "") // remove dimension attributes
        .replace(/style="[^"]*"/g, "") // remove inline styles
        .replace(/color="[^"]*"/g, "");

    if (!preserveColor) {
        svg = svg
            .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
            .replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"');
    }

    const hasViewBox = /viewBox="[^"]*"/.test(svg);
    const svgOpenTagRegex = /<svg([^>]*)>/;

    svg = svg.replace(svgOpenTagRegex, (_match, attrs) => {
        const viewBoxAttr = hasViewBox ? "" : ' viewBox="0 0 256 256"';
        const styleAttr = ' style="width: 100%; height: 100%; object-fit: contain;"';
        const colorAttrs = preserveColor ? "" : ' fill="currentColor" stroke="currentColor"';
        return `<svg${attrs}${viewBoxAttr}${styleAttr}${colorAttrs}>`;
    });

    svg = svg.replace(/<clipPath[\s\S]*?<\/clipPath>/g, '');
    svg = svg.replace(/clip-path="url\(#.*?\)"/g, '');

    return svg.trim();
};

const NodeIcon = ({
    className,
    icon,
    preserveColor = false,
}: {
    className?: string;
    icon: string;
    preserveColor?: boolean;
}) => {
    const processedSvg = normalizeSvg(icon, preserveColor);

    return (
        <div className={clsx("rounded inline-flex items-center justify-center overflow-hidden", className)}>
            <div
                dangerouslySetInnerHTML={{ __html: processedSvg }}
            />
        </div>
    );
};

export default NodeIcon;