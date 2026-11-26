# n8n-nodes-ailayoffs

This is an n8n community node for [AI Layoffs](https://ailayoffs.org). It lets you start workflows on new US WARN notices and on job cuts recorded worldwide, and look up any company's layoffs by web domain, ticker or name.

AI Layoffs keeps a source-cited register of job cuts (with whether the employer tied each one to AI) and reads every US WARN notice (the layoff and closure filings employers must make with US states) every day.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Compatibility](#compatibility) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation: in n8n, open **Settings > Community Nodes > Install** and enter `n8n-nodes-ailayoffs`.

## Operations

**AI Layoffs Trigger** (polling)
- **New WARN Notice**: each new US WARN notice, optionally only in chosen states, at an employer whose name holds given words, or with at least a given number of jobs.
- **New Layoff**: each job cut AI Layoffs records worldwide, optionally only those linked to AI, in a country or at a company.

**AI Layoffs**
- **Company > Find Layoffs**: one company's job cuts, its statements on AI and headcount, and its US WARN notices since 2019, by web domain, ticker or company name.
- **WARN Notice > Get Many**: the newest US WARN notices, with the same filters as the trigger and a date to start from.
- **Layoff > Get Many**: the newest job cuts recorded worldwide.

The AI Layoffs node can also be used as a tool by n8n's AI Agent.

## Credentials

1. Go to [ailayoffs.org/integrations](https://ailayoffs.org/integrations).
2. Fill in **Get a free key** with your work email address. The key arrives by email within a minute and is free for 30 days.
3. In n8n, create an **AI Layoffs API** credential and paste the key as the API key.

After the trial, the triggers stay on with [layoff alerts](https://ailayoffs.org/layoff-alerts) for the same email address ($29 a month), and company lookups cost $0.04 per lookup that finds a company (lookups that find nothing are free).

## Compatibility

Built and tested with n8n 1.x (n8n nodes API version 1). No runtime dependencies.

## Usage

- Post every WARN notice of 50 jobs or more in your state to a Slack channel: **AI Layoffs Trigger** (New WARN Notice, States: Texas, Minimum Jobs: 50) followed by a Slack node.
- Enrich new CRM companies: on a new HubSpot company, call **AI Layoffs > Company > Find Layoffs** with its domain and write the number of job cuts to a property.

Every item carries a stable `id`, a link to its page on AI Layoffs and the address of its source.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [AI Layoffs API (OpenAPI)](https://ailayoffs.org/api/v1/openapi.json)
- [AI Layoffs integrations guide](https://ailayoffs.org/integrations)

## Version history

- 0.1.0: first release (trigger, company lookup, WARN notices and layoffs).
