export const fetchProjects  = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/projects/`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    return response.json();
};
