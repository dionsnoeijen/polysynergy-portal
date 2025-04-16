import {Secret} from "@/types/types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchSecretsWithRetry = async (
    fetchSecretsFn: () => Promise<Secret[]>,
    attempts = 3,
    delay = 400
) => {
    for (let i = 0; i < attempts; i++) {
        await sleep(delay);
        await fetchSecretsFn();
    }
};