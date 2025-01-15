let idToken: string | null = null;

export const setIdToken = (token: string) => {
    idToken = token;
};

export const getIdToken = (): string | null => {
    return idToken;
};