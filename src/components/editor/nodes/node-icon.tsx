import React from "react";
import clsx from "clsx";

const isSimpleSvg = (svg: string): boolean => {
    // Only mark as complex if it has features we can't safely convert
    const complexityIndicators = [
        /<style[\s\S]*?>[\s\S]*?<\/style>/,
        /<defs[\s\S]*?>[\s\S]*?<\/defs>/,
        /<clipPath[\s\S]*?>[\s\S]*?<\/clipPath>/,
        /<linearGradient[\s\S]*?>[\s\S]*?<\/linearGradient>/,
        /<radialGradient[\s\S]*?>[\s\S]*?<\/radialGradient>/,
        /<pattern[\s\S]*?>[\s\S]*?<\/pattern>/,
        /url\(#/,
        /filter="/,
        /font-family="/,
        /class="/,
        // Remove fill and stroke from complexity check - we can replace those
        /stop-color=/,
        /stop-opacity=/,
    ];

    return !complexityIndicators.some((regex) => regex.test(svg));
};

const normalizeSvg = (raw: string, preserveColor: boolean = false): string => {
    if (preserveColor) {
        // PRESERVE COLORS: Only remove XML/DOCTYPE and add sizing for visibility
        let svg = raw
            .replace(/<\?xml[^>]*>/g, "")
            .replace(/<!DOCTYPE[^>]*>/g, "")
            .trim();

        // Add width/height to make SVG visible, but don't touch any color attributes
        const svgOpenTagRegex = /<svg([^>]*)>/;
        svg = svg.replace(svgOpenTagRegex, (_match, attrs) => {
            // Only add style if not already present
            if (!attrs.includes('style=')) {
                return `<svg${attrs} style="width: 100%; height: 100%;">`;
            }
            return `<svg${attrs}>`;
        });

        return svg;
    }

    let svg = raw
        .replace(/<\?xml[^>]*>/g, "") // remove XML declaration
        .replace(/<!DOCTYPE[^>]*>/g, "") // remove DOCTYPE
        .replace(/(width|height)="[^"]*"/g, ""); // remove dimension attributes

    // NOT preserving colors: full color replacement
    svg = svg
        .replace(/style="[^"]*"/g, "") // remove inline styles
        .replace(/color="[^"]*"/g, "")
        .replace(/fill="(?!none|transparent)[^"]*"/g, 'fill="currentColor"')
        .replace(/stroke="(?!none|transparent)[^"]*"/g, 'stroke="currentColor"')
        .replace(/fill='(?!none|transparent)[^']*'/g, "fill='currentColor'")
        .replace(/stroke='(?!none|transparent)[^']*'/g, "stroke='currentColor'");

    const hasViewBox = /viewBox="[^"]*"/.test(svg);
    const svgOpenTagRegex = /<svg([^>]*)>/;

    svg = svg.replace(svgOpenTagRegex, (_match, attrs) => {
        const viewBoxAttr = hasViewBox ? "" : ' viewBox="0 0 256 256"';
        const styleAttr = ' style="width: 100%; height: 100%; object-fit: contain;"';
        const colorAttrs = ' fill="currentColor"';
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

    // Preserve color if:
    // 1. preserveColor prop is true (service nodes, nodes in services)
    // 2. SVG is complex (has gradients, filters, etc - would break if colors replaced)
    const isSimple = isSimpleSvg(icon);
    const shouldPreserve = preserveColor || !isSimple;
    const processedSvg = normalizeSvg(icon, shouldPreserve);

    return (
        <div className={clsx("rounded inline-flex items-center justify-center", className)}>
            <div
                dangerouslySetInnerHTML={{__html: processedSvg}}
            />
        </div>
    );
};

export default NodeIcon;