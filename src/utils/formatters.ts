import { RouteSegment, RouteSegmentType } from "@/types/types";

export function formatSegments(segments: RouteSegment[]): string {
    return segments
        .map((segment) =>
            segment.type === RouteSegmentType.Variable
                ? `{${segment.name}<${segment.variable_type || 'any'}${segment.default_value ? ':' + segment.default_value : ''}>}`
                : segment.name
        )
        .join('/');
}
