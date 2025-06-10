// utils/placeService.ts
import {
    Node, Connection,
    Service
} from "@/types/types";
import {
    globalToLocal
} from "@/utils/positionUtils";
import {uniqueNamesGenerator, adjectives, animals, colors} from "unique-names-generator";
import {unpackNode} from "@/utils/packageGroupNode";

type PlaceCtx = {
    service: Service;
    mouseScreenXY: { x: number; y: number };
    // stores
    addNode: (n: Node) => void;
    addConnection: (c: Connection) => void;
    getNodesByServiceHandleAndVariant: (handle: string, variant: number) => Node[];
    openedGroup?: string | null;
    addNodeToGroup: (groupId: string, nodeId: string) => void;
};

export default function placeService(ctx: PlaceCtx) {
    const {service} = ctx;
    const pkg = service.node_setup.versions[0].content;
    if (!pkg) return;

    const {nodes: pkgNodes, connections} = unpackNode(pkg); // bestaande helper

    /* 1️⃣ sync eventuele already-present published vars (oude logica) */
    const updatedNodes = pkgNodes.map((n) => {
        const handle = n.service?.handle;
        const variant = n.service?.variant;
        if (!handle || variant === undefined) return n;

        const existing = ctx.getNodesByServiceHandleAndVariant(handle, variant);
        if (existing.length === 0) return n;

        const ref = existing[0];
        const vars = n.variables.map((v) =>
            v.published
                ? {
                    ...v,
                    value: ref.variables.find((rv) => rv.handle === v.handle)?.value,
                }
                : v
        );
        return {...n, variables: vars};
    });

    /* 2️⃣ bepaal drop-positie – relative aan muisklik */
    const pos = globalToLocal(ctx.mouseScreenXY.x, ctx.mouseScreenXY.y);

    /* 3️⃣ voeg nodes en connections toe */
    updatedNodes.forEach((n, idx) => {
        const copy: Node = {
            ...n,
            temp: undefined,
            handle: uniqueNamesGenerator({dictionaries: [adjectives, animals, colors]}),
            view: {
                ...n.view,
                x: n.view.x + pos.x,
                y: n.view.y + pos.y,
                width: 200,
                height: 200,
                disabled: false,
                adding: idx === updatedNodes.length - 1,
                collapsed: false,
            },
        };
        ctx.addNode(copy);
    });

    connections?.forEach((c) => {
        delete c.temp;
        ctx.addConnection(c);
    });

    /* 4️⃣ stop ze in een eventueel geopende group */
    if (ctx.openedGroup && updatedNodes.length) {
        ctx.addNodeToGroup(ctx.openedGroup, updatedNodes[0].id);
    }
}