import {create} from "zustand";
import {Service} from "@/types/types";
import {StateCreator} from "zustand/index";
import {fetchServices as fetchServicesAPI} from "@/api/servicesApi";

type ServicesStore = {
    services: Service[];
    getService: (serviceId: string) => Service | undefined;
    fetchServices: () => Promise<void>;
};

const useServicesStore = create<ServicesStore>((
    set: Parameters<StateCreator<ServicesStore>>[0],
    get: () => ServicesStore
) => ({
    services: [],

    getService: (serviceId: string): Service | undefined => {
        return get().services.find((service: Service) => service.id === serviceId);
    },

    fetchServices: async () => {
        try {
            const data: Service[] = await fetchServicesAPI();
            set({services: data});
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    }
}));

export default useServicesStore;