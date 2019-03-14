import { GreenhouseApplicationResponse } from '../../data_sources/greenhouse';
import { GreenhouseApplication } from '../../entities';

/**
 * One-to-one transformation of Greenhouse API application object to corresponding entity
 * @param response an application object from Greenhouse Harvest API
 */
export function parseApplications(response: GreenhouseApplicationResponse): GreenhouseApplication {
    return {
        id: response.id,
        candidate_id: response.candidate_id,
        applied_at: new Date(response.applied_at),
        rejected_at: response.rejected_at ? new Date(response.rejected_at) : undefined,
        last_activity_at: new Date(response.last_activity_at),
        source_id: response.source ? response.source.id : undefined,
        source_name: response.source ? response.source.public_name : undefined,
        credited_to_id: response.credited_to ? response.credited_to.id : undefined,
        credited_to_name: response.credited_to ? response.credited_to.name : undefined,
        status: response.status.toString(),
        current_stage_id: response.current_stage ? response.current_stage.id : undefined,
        current_stage_name: response.current_stage ? response.current_stage.name : undefined,
    };
}
