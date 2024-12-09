import { Node, NodeComparisonType, NodeMathType, NodeType, NodeVariableType } from "@/types/types";
import { Connection } from "@/stores/connectionsStore";
import { Group } from "@/stores/groupStore";

export const connectionDevData: Connection[] = [];

export const groupDevData: Record<string, Group> = {};

export const nodeDevData: Node[] = [
    {
        "id": "4b14bd4f-d8eb-4c4b-a3ac-163d3357e83e",
        "view": {
            "x": 100,
            "y": 500,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Add",
        "type": "add",
        "node_type": "math",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "Result",
                "handle": "result",
                "value": 0,
                "type": "number",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "01977873-105f-4fcf-931c-020450b1b8db",
        "view": {
            "x": 200,
            "y": 500,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Subtract",
        "type": "subtract",
        "node_type": "math",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "Result",
                "handle": "result",
                "value": 0,
                "type": "number",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "e7286e49-1673-44cd-ac29-63cc261837ea",
        "view": {
            "x": 300,
            "y": 500,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Multiply",
        "type": "multiply",
        "node_type": "math",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "Result",
                "handle": "result",
                "value": 0,
                "type": "number",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "5591c41b-ba8d-4fb9-ba29-f383780f3894",
        "view": {
            "x": 400,
            "y": 500,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Divide",
        "type": "divide",
        "node_type": "math",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "Result",
                "handle": "result",
                "value": 0,
                "type": "number",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "fa8777ce-7ae3-4720-b1a5-0b86cb2ae654",
        "view": {
            "x": 100,
            "y": 400,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Larger Than",
        "type": "larger_than",
        "node_type": "comparison",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "True",
                "handle": "true",
                "value": false,
                "type": "true_path",
                "has_dock": false,
                "has_out": true
            },
            {
                "name": "False",
                "handle": "false",
                "value": false,
                "type": "false_path",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "773c2347-d984-4e9c-b699-276a90fe351f",
        "view": {
            "x": 200,
            "y": 400,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Smaller Than",
        "type": "smaller_than",
        "node_type": "comparison",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "True",
                "handle": "true",
                "value": false,
                "type": "true_path",
                "has_dock": false,
                "has_out": true
            },
            {
                "name": "False",
                "handle": "false",
                "value": false,
                "type": "false_path",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "4987bd61-4ac0-4a5a-b6d1-233f55099844",
        "view": {
            "x": 300,
            "y": 400,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Equal",
        "type": "equal",
        "node_type": "comparison",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "True",
                "handle": "true",
                "value": false,
                "type": "true_path",
                "has_dock": false,
                "has_out": true
            },
            {
                "name": "False",
                "handle": "false",
                "value": false,
                "type": "false_path",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "f229cdf3-b94e-4627-966b-94db99e585cf",
        "view": {
            "x": 400,
            "y": 400,
            "width": 50,
            "height": 50,
            "disabled": false
        },
        "name": "Not Equal",
        "type": "not_equal",
        "node_type": "comparison",
        "variables": [
            {
                "name": "A",
                "handle": "a",
                "value": 10,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "A Variable",
                "handle": "aVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "B",
                "handle": "b",
                "value": 5,
                "type": "number",
                "has_dock": true,
                "has_in": true
            },
            {
                "name": "B Variable",
                "handle": "bVariable",
                "value": null,
                "type": "string",
                "has_dock": true
            },
            {
                "name": "True",
                "handle": "true",
                "value": false,
                "type": "true_path",
                "has_dock": false,
                "has_out": true
            },
            {
                "name": "False",
                "handle": "false",
                "value": false,
                "type": "false_path",
                "has_dock": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "e8941d69-af86-4cbc-83cd-758c8b80e89c",
        "view": {
            "x": 875.5560851672403,
            "y": 68.46518734289396,
            "width": 200,
            "height": 173.88333129882812,
            "disabled": false
        },
        "name": "Route",
        "type": "route",
        "node_type": "rows",
        "enabled": true,
        "variables": [
            {
                "name": "Route Variables",
                "handle": "routeVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": "59027142-1a33-4d75-8ee6-231d7b4a3335",
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Name",
                "handle": "name",
                "value": "John Doe",
                "type": "string",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Age",
                "handle": "age",
                "value": 30,
                "type": "number",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Human",
                "handle": "human",
                "value": true,
                "type": "boolean",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Super Variables",
                "handle": "superVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true
            },
            {
                "name": "Output",
                "handle": "output",
                "value": true,
                "type": "true_path",
                "has_dock": false,
                "has_in": false,
                "has_out": true
            },
            {
                "name": "Exception",
                "handle": "exception",
                "value": true,
                "type": "false_path",
                "has_dock": false,
                "has_in": false,
                "has_out": true
            }
        ]
    },
    {
        "id": "15bcbcac-ae11-4ca4-ac9b-601f431a90db",
        "view": {
            "x": 608.5591571359054,
            "y": 85.78688575525655,
            "width": 200,
            "height": 149.63333129882812,
            "disabled": false
        },
        "name": "Route",
        "type": "route",
        "node_type": "rows",
        "enabled": true,
        "variables": [
            {
                "name": "Route Variables",
                "handle": "routeVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Name",
                "handle": "name",
                "value": "John Doe",
                "type": "string",
                "has_dock": false,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Age",
                "handle": "age",
                "value": 30,
                "type": "number",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Super Variables",
                "handle": "superVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            }
        ]
    },
    {
        "id": "4fcee4b2-49cf-405f-bf30-1dcb61abd79e",
        "view": {
            "x": 754.0318825444513,
            "y": 105.06276621838845,
            "width": 200,
            "height": 149.6333465576172,
            "disabled": false
        },
        "name": "Route",
        "type": "route",
        "node_type": "rows",
        "enabled": true,
        "variables": [
            {
                "name": "Route Variables",
                "handle": "routeVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Name",
                "handle": "name",
                "value": "John Doe",
                "type": "string",
                "has_dock": false,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Age",
                "handle": "age",
                "value": 30,
                "type": "number",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Super Variables",
                "handle": "superVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            }
        ]
    },
    {
        "id": "0aefce78-5db0-4a11-a89e-cbe358fab4d5",
        "view": {
            "x": 1054.0318825444513,
            "y": 105.06276621838845,
            "width": 200,
            "height": 149.6333465576172,
            "disabled": false
        },
        "name": "Route",
        "type": "route",
        "node_type": "rows",
        "enabled": true,
        "variables": [
            {
                "name": "Route Variables",
                "handle": "routeVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Name",
                "handle": "name",
                "value": "John Doe",
                "type": "string",
                "has_dock": false,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Age",
                "handle": "age",
                "value": 30,
                "type": "number",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            },
            {
                "name": "Super Variables",
                "handle": "superVariables",
                "value": [
                    {
                        "name": "{amount}",
                        "handle": "amount",
                        "value": null,
                        "default_value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{age}",
                        "handle": "age",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{id}",
                        "handle": "id",
                        "value": 30,
                        "type": "string",
                        "has_in": true,
                        "has_out": true
                    },
                    {
                        "name": "{space}",
                        "handle": "space",
                        "value": 30,
                        "type": "number",
                        "has_in": true,
                        "has_out": true
                    }
                ],
                "type": "array",
                "has_dock": true,
                "has_in": true,
                "has_out": true
            }
        ]
    }
];
