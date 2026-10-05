import {Vehicle} from '@/fleet/domain/model/vehicle.entity.js';

/**
 * Assembler that maps Vehicle resources to entities and back.
 */
export class VehicleAssembler {
    /**
     * Converts a resource into a Vehicle entity.
     *
     * @param {import('./fleet-resources.js').VehicleResource} resource - The API resource.
     * @returns {Vehicle}
     */
    static toEntityFromResource(resource) {
        return new Vehicle({...resource, photos: resource.photos ?? [], features: resource.features ?? []});
    }

    /**
     * Converts a list response into Vehicle entities, skipping invalid records.
     *
     * @param {import('axios').AxiosResponse} response - The API response.
     * @returns {Vehicle[]}
     */
    static toEntitiesFromResponse(response) {
        return (response.data || []).map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error('Validation error for vehicle:', error.message, resource);
                return null;
            }
        }).filter(vehicle => vehicle !== null);
    }

    /**
     * Converts a Vehicle entity into the resource expected by the API.
     *
     * @param {Vehicle} vehicle - The vehicle entity.
     * @returns {import('./fleet-resources.js').VehicleResource}
     */
    static toResourceFromEntity(vehicle) {
        const resource = {
            ownerId: vehicle.ownerId,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            category: vehicle.category,
            bodyType: vehicle.bodyType,
            transmission: vehicle.transmission,
            fuelType: vehicle.fuelType,
            seats: vehicle.seats,
            doors: vehicle.doors,
            pricePerDay: vehicle.pricePerDay.amount,
            pricePerWeek: vehicle.pricePerWeek.amount,
            pricePerMonth: vehicle.pricePerMonth.amount,
            securityDeposit: vehicle.securityDeposit.amount,
            description: vehicle.description,
            features: [...vehicle.features],
            photos: vehicle.photos.map(photo => photo.toString()),
            location: {
                address: vehicle.location.address,
                district: vehicle.location.district,
                city: vehicle.location.city,
                latitude: vehicle.location.latitude,
                longitude: vehicle.location.longitude
            },
            published: vehicle.published,
            rating: vehicle.rating,
            reviewsCount: vehicle.reviewsCount,
            plate: vehicle.plate,
            color: vehicle.color,
            mileage: vehicle.mileage,
            lastMaintenanceAt: vehicle.lastMaintenanceAt,
            insurance: vehicle.insurance ? {...vehicle.insurance} : null,
            technicalInspectionUntil: vehicle.technicalInspectionUntil
        };
        if (vehicle.id !== null) resource.id = vehicle.id;
        return resource;
    }
}
