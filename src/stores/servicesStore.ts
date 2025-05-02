import {create} from "zustand";
import {Package, Service} from "@/types/types";
import {StateCreator} from "zustand/index";
import {fetchServices as fetchServicesAPI} from "@/api/servicesApi";
import {deleteService as deleteServiceAPI} from "@/api/servicesApi";
import {storeService as storeServiceAPI} from "@/api/servicesApi";
import useEditorStore from "@/stores/editorStore";

type ServicesStore = {
    reset: () => void;
    hasInitialFetched: boolean;
    services: Service[];
    getService: (serviceId: string) => Service | undefined;
    storeService: (id: string, name: string, category: string, description: string, packagedData: Package) => Promise<void>;
    fetchServices: () => Promise<void>;
    deleteService: (serviceId: string) => Promise<void>;
};

const useServicesStore = create<ServicesStore>((
    set: Parameters<StateCreator<ServicesStore>>[0],
    get: () => ServicesStore
) => ({
    reset: () => {
        set({
            services: [],
            hasInitialFetched: false,
        });
    },

    hasInitialFetched: false,

    services: [],

    getService: (serviceId: string): Service | undefined => {
        return get().services.find((service: Service) => service.id === serviceId);
    },

    storeService: async (id: string, name: string, category: string, description: string, packagedData: Package) => {
        const {activeProjectId} = useEditorStore.getState();
        try {
            const response = await storeServiceAPI(id, name, category, description, packagedData, [activeProjectId]);
            set((state) => ({services: [...state.services, response]}));
        } catch (error) {
            console.error('Failed to store service:', error);
        }
    },

    fetchServices: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const data: Service[] = await fetchServicesAPI(activeProjectId);
            set({services: data, hasInitialFetched: true});
        } catch (error) {
            console.error('Failed to fetch services:', error);
        }
    },

    deleteService: async (serviceId: string) => {
        try {
            await deleteServiceAPI(serviceId);
            set((state) => ({services: state.services.filter((service) => service.id !== serviceId)}));
        } catch (error) {
            console.error('Failed to delete service:', error);
        }
    }
}));

export default useServicesStore;