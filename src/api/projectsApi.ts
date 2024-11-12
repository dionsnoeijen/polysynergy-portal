export const fetchProjects  = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_OCTOPUS_API}/projects/`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    return response.json();
};
