import { Id, NamesMapping } from '../models';
import { CachedValue } from './cached-value.service';
import { SportEventsService } from './sport-events.service';

export class MappingService {
    public static MAPPING = new CachedValue<NamesMapping>(async () => {
        const response = await SportEventsService.getNamesMapping();
        return MappingService.parseMapping(response.data.mappings);
    }, 2 * 60 * 1000);

    private static parseMapping: (mappingString: string) => NamesMapping = mappingString => {
        const values = mappingString.split(';');

        return values.reduce((mapping, keyValue) => {
            const [key, value] = keyValue.split(':');
            mapping.set(key, value);
            return mapping;
        }, new Map<Id, string>());
    }
}