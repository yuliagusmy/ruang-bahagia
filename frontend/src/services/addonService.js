import api from './api';

export const addonService = {
    getByPackage: async (packageId) => {
        const response = await api.get(`/packages/${packageId}/addons`);
        return response.data;
    },
    create: async (packageId, data) => {
        const response = await api.post(`/packages/${packageId}/addons`, data);
        return response.data;
    },
    delete: async (packageId, addonId) => {
        const response = await api.delete(`/packages/${packageId}/addons/${addonId}`);
        return response.data;
    }
};
