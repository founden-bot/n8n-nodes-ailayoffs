import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AiLayoffsApi implements ICredentialType {
	name = 'aiLayoffsApi';

	displayName = 'AI Layoffs API';

	icon: Icon = { light: 'file:../icons/ailayoffs.svg', dark: 'file:../icons/ailayoffs.dark.svg' };

	documentationUrl = 'https://ailayoffs.org/integrations';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Get a free key (30 days) at https://ailayoffs.org/integrations: fill in "Get a free key" with your work email address and paste the key from the email.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://ailayoffs.org/api/v1',
			url: '/me',
			method: 'GET',
		},
	};
}
