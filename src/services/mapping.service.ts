import { inspect } from 'node:util';
import { Id, NamesMapping } from '../models';
import { CachedValue } from './cached-value.service';
import { sportEventsService } from './sport-events.service';

/**
 * Service for managing and caching name mappings for event entities.
 */
class MappingService {
    /**
     * Cached value for names mapping, refreshed every 2 minutes.
     */
    public readonly namesMapping = new CachedValue<NamesMapping>(
        async () => this.getNamesMapping(),
        2 * 60 * 1000
    );

    /**
     * Gets the mapped name for a given ID.
     * @param {string} id - The entity ID.
     * @param {NamesMapping} mapping - The mapping to use.
     * @returns {string} The mapped name.
     * @throws If no name is found for the ID.
     */
    public getName(id: string, mapping: NamesMapping): string {
        const name = mapping.get(id);
        if (!name) {
            this.namesMapping.getValue(true);
            throw new Error(`No name for id ${id}`);
        }
        return name;
    }

    /**
     * Fetches and parses the names mapping from the backend.
     * @returns {Promise<NamesMapping>} The parsed names mapping.
     */
    private async getNamesMapping(): Promise<NamesMapping> {
        try {
            const response = await sportEventsService.getNamesMapping();
            return this.parseMapping(response.data.mappings);
        } catch (e) {
            console.error(
                `There's been an error fetching the names mapping: ${inspect(e, { depth: null })}`
            );
            return new Map<Id, string>();
        }
    }

    /**
     * Parses the mapping string into a NamesMapping object.
     * @param {string} mappingString - The raw mapping string.
     * @returns {NamesMapping} The parsed mapping.
     */
    private parseMapping: (mappingString: string) => NamesMapping = (
        mappingString
    ) => {
        const values = mappingString.split(';');

        return values.reduce((mapping, keyValue) => {
            const [key, value] = keyValue.split(':');
            mapping.set(key, value);
            return mapping;
        }, new Map<Id, string>());
    };
}

export const mappingService = new MappingService();
