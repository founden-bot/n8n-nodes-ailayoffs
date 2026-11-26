import {
	NodeConnectionTypes,
	NodeApiError,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IPollFunctions,
	type JsonObject,
} from 'n8n-workflow';
import { US_STATE_OPTIONS } from '../shared/states';

/** How many ids of items already passed on are kept, so a later poll never passes one on again. */
const SEEN_KEEP = 1000;

export class AiLayoffsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Layoffs Trigger',
		name: 'aiLayoffsTrigger',
		icon: { light: 'file:../../icons/ailayoffs.svg', dark: 'file:../../icons/ailayoffs.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow on new US WARN notices or new job cuts recorded by AI Layoffs',
		defaults: {
			name: 'AI Layoffs Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'aiLayoffsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New WARN Notice',
						value: 'warnNotice',
						description: 'A US employer files a new WARN notice (a layoff or closure it must announce to the state)',
					},
					{
						name: 'New Layoff',
						value: 'layoff',
						description: 'AI Layoffs records a new job cut anywhere in the world',
					},
				],
				default: 'warnNotice',
			},
			{
				displayName: 'Filters',
				name: 'warnFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				displayOptions: { show: { event: ['warnNotice'] } },
				default: {},
				options: [
					{
						displayName: 'Employer Name Contains',
						name: 'company',
						type: 'string',
						default: '',
						description: 'Only notices whose employer name holds these words',
					},
					{
						displayName: 'Minimum Jobs',
						name: 'minJobs',
						type: 'number',
						default: 0,
						description: 'Only notices that state at least this many jobs',
					},
					{
						displayName: 'States',
						name: 'states',
						type: 'multiOptions',
						options: US_STATE_OPTIONS,
						default: [],
						description: 'Only notices filed in these states',
					},
				],
			},
			{
				displayName: 'Filters',
				name: 'layoffFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				displayOptions: { show: { event: ['layoff'] } },
				default: {},
				options: [
					{
						displayName: 'Company Name Contains',
						name: 'company',
						type: 'string',
						default: '',
						description: 'Only cuts at a company whose name holds these words',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'United States',
						description: 'Only cuts in this country',
					},
					{
						displayName: 'Only Cuts Linked to AI',
						name: 'aiOnly',
						type: 'boolean',
						default: false,
						description: 'Whether to trigger only on the cuts the employer, or credible reporting, tied to AI',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const qs: IDataObject = { limit: 100 };
		let url: string;
		let listKey: string;
		if (event === 'warnNotice') {
			const f = this.getNodeParameter('warnFilters', {}) as IDataObject;
			url = 'https://ailayoffs.org/api/v1/warn-notices';
			listKey = 'notices';
			if (Array.isArray(f.states) && f.states.length) qs.state = (f.states as string[]).join(',');
			if (f.company) qs.company = f.company;
			if (f.minJobs) qs.min_jobs = f.minJobs;
		} else {
			const f = this.getNodeParameter('layoffFilters', {}) as IDataObject;
			url = 'https://ailayoffs.org/api/v1/layoffs';
			listKey = 'layoffs';
			if (f.company) qs.company = f.company;
			if (f.country) qs.country = f.country;
			if (f.aiOnly) qs.ai_only = 'true';
		}

		let response: IDataObject;
		try {
			response = (await this.helpers.httpRequestWithAuthentication.call(this, 'aiLayoffsApi', {
				method: 'GET',
				url,
				qs,
				json: true,
			})) as IDataObject;
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
		const items = ((response[listKey] as IDataObject[]) ?? []).filter((i) => typeof i.id === 'string');

		// A manual test shows the newest item, so the workflow can be built on real data.
		if (this.getMode() === 'manual') {
			return items.length ? [this.helpers.returnJsonArray(items.slice(0, 1))] : null;
		}

		const staticData = this.getWorkflowStaticData('node');
		const key = `seen:${event}`;
		const seen = new Set((staticData[key] as string[] | undefined) ?? []);
		const firstPoll = staticData[key] === undefined;
		const fresh = items.filter((i) => !seen.has(i.id as string));
		staticData[key] = [...items.map((i) => i.id as string), ...[...seen].filter((id) => !items.some((i) => i.id === id))].slice(0, SEEN_KEEP);

		// The first poll after activation only learns what already exists: it never floods a workflow with the backlog.
		if (firstPoll || fresh.length === 0) return null;
		return [this.helpers.returnJsonArray(fresh)];
	}
}
