import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { US_STATE_OPTIONS } from '../shared/states';

export class AiLayoffs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Layoffs',
		name: 'aiLayoffs',
		icon: { light: 'file:../../icons/ailayoffs.svg', dark: 'file:../../icons/ailayoffs.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Look up company layoffs, US WARN notices and job cuts worldwide from AI Layoffs',
		defaults: {
			name: 'AI Layoffs',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'aiLayoffsApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://ailayoffs.org/api/v1',
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Company', value: 'company' },
					{ name: 'Layoff', value: 'layoff' },
					{ name: 'WARN Notice', value: 'warnNotice' },
				],
				default: 'company',
			},

			// Company
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['company'] } },
				options: [
					{
						name: 'Find Layoffs',
						value: 'findLayoffs',
						description: "Find a company's job cuts, AI statements and US WARN notices",
						action: 'Find a company s layoffs',
						routing: { request: { method: 'GET', url: '/company' } },
					},
				],
				default: 'findLayoffs',
			},
			{
				displayName: 'Look Up By',
				name: 'lookUpBy',
				type: 'options',
				displayOptions: { show: { resource: ['company'], operation: ['findLayoffs'] } },
				options: [
					{ name: 'Web Domain', value: 'domain', description: 'The company website or an email address at it' },
					{ name: 'Ticker', value: 'ticker', description: 'The company stock symbol' },
					{ name: 'Company Name', value: 'name', description: 'Also finds employers that are not listed, by the name on their WARN notices' },
				],
				default: 'domain',
			},
			{
				displayName: 'Web Domain',
				name: 'domain',
				type: 'string',
				required: true,
				placeholder: 'salesforce.com',
				displayOptions: { show: { resource: ['company'], operation: ['findLayoffs'], lookUpBy: ['domain'] } },
				default: '',
				description: 'The company website or an email address at it',
				routing: { send: { type: 'query', property: 'domain' } },
			},
			{
				displayName: 'Ticker',
				name: 'ticker',
				type: 'string',
				required: true,
				placeholder: 'CRM',
				displayOptions: { show: { resource: ['company'], operation: ['findLayoffs'], lookUpBy: ['ticker'] } },
				default: '',
				description: 'The company stock symbol',
				routing: { send: { type: 'query', property: 'ticker' } },
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				required: true,
				placeholder: 'Kaiser Foundation Hospitals',
				displayOptions: { show: { resource: ['company'], operation: ['findLayoffs'], lookUpBy: ['name'] } },
				default: '',
				routing: { send: { type: 'query', property: 'name' } },
			},

			// WARN notices
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['warnNotice'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get the newest US WARN notices',
						action: 'Get many WARN notices',
						routing: {
							request: { method: 'GET', url: '/warn-notices' },
							output: { postReceive: [{ type: 'rootProperty', properties: { property: 'notices' } }] },
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 200 },
				displayOptions: { show: { resource: ['warnNotice', 'layoff'], operation: ['getAll'] } },
				default: 50,
				description: 'Max number of results to return',
				routing: { send: { type: 'query', property: 'limit' } },
			},
			{
				displayName: 'Filters',
				name: 'warnFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				displayOptions: { show: { resource: ['warnNotice'], operation: ['getAll'] } },
				default: {},
				options: [
					{
						displayName: 'Employer Name Contains',
						name: 'company',
						type: 'string',
						default: '',
						description: 'Only notices whose employer name holds these words',
						routing: { send: { type: 'query', property: 'company' } },
					},
					{
						displayName: 'Minimum Jobs',
						name: 'minJobs',
						type: 'number',
						default: 0,
						description: 'Only notices that state at least this many jobs',
						routing: { send: { type: 'query', property: 'min_jobs' } },
					},
					{
						displayName: 'Since',
						name: 'since',
						type: 'dateTime',
						default: '',
						description: 'Only notices first read on or after this day (up to 90 days back)',
						routing: { send: { type: 'query', property: 'since', value: '={{ $value ? $value.slice(0, 10) : undefined }}' } },
					},
					{
						displayName: 'States',
						name: 'states',
						type: 'multiOptions',
						options: US_STATE_OPTIONS,
						default: [],
						description: 'Only notices filed in these states',
						routing: { send: { type: 'query', property: 'state', value: '={{ $value.join(",") }}' } },
					},
				],
			},

			// Layoffs
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['layoff'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get the newest job cuts recorded worldwide',
						action: 'Get many layoffs',
						routing: {
							request: { method: 'GET', url: '/layoffs' },
							output: { postReceive: [{ type: 'rootProperty', properties: { property: 'layoffs' } }] },
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Filters',
				name: 'layoffFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				displayOptions: { show: { resource: ['layoff'], operation: ['getAll'] } },
				default: {},
				options: [
					{
						displayName: 'Company Name Contains',
						name: 'company',
						type: 'string',
						default: '',
						description: 'Only cuts at a company whose name holds these words',
						routing: { send: { type: 'query', property: 'company' } },
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'United States',
						description: 'Only cuts in this country',
						routing: { send: { type: 'query', property: 'country' } },
					},
					{
						displayName: 'Only Cuts Linked to AI',
						name: 'aiOnly',
						type: 'boolean',
						default: false,
						description: 'Whether to return only the cuts the employer, or credible reporting, tied to AI',
						routing: { send: { type: 'query', property: 'ai_only' } },
					},
				],
			},
		],
	};
}
