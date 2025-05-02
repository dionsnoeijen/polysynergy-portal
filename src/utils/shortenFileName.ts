export const shortenFileName = (fullKey: string) => {
    const parts = fullKey.split("/");
    if (parts.length >= 3) {
        return parts.slice(1).join("/");
    }
    return fullKey;
};