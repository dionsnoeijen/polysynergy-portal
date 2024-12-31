export const fetchAvailableNodesAPI = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/nodes/`, {
        headers: {
            'Accept': 'application/json',
        },
    });

    return response.json();
};