import {create} from "zustand";
import {Service} from "@/types/types";
import {StateCreator} from "zustand/index";

type ServicesStore = {
    services: Service[];
    getService: (serviceId: string) => Service | undefined;
};

const useServicesStore = create<ServicesStore>((
    set: Parameters<StateCreator<ServicesStore>>[0],
    get: () => ServicesStore
) => ({
    services: [],

    getService: (serviceId: string): Service | undefined => {
        return get().services.find((service: Service) => service.id === serviceId);
    }
}));

export default useServicesStore;