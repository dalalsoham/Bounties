import fs from 'node:fs/promises';
import { GraphQL } from '@rayhanadev/replit-gql';
const client = GraphQL(process.env.REPLIT_TOKEN);

import query from './query.graphql';

import moment from 'moment';
import mdescape from 'remove-markdown';

const getAfter = async (after = null) => {
	const { data, errors } = await client.query({
		query: query,
		variables: {
			after: after ? String(after) : null,
		}
	});

	if(errors) {
		console.error(errors);
		return;
	}

	if(data.bountySearch.message) {
		throw new Error(data.bountySearch.message);
	}
	
	const ownedBounties = data.bountySearch.items
		.filter((data) => data.owned === true);
	
	return [ownedBounties, data.bountySearch.pageInfo];
};

const main = async () => {
	let pageInfo = {
		after: null,
		hasAfter: true,
	};
	
	let bounties = [];
	
	while(pageInfo.hasAfter) {
		const data = await getAfter(pageInfo.after);
		bounties = bounties.concat(data[0]);
		pageInfo = data[1];
	};

	await fs.writeFile('./README.md', bounties.map((bounty) =>
`## ${bounty.status === 'closed' ? '✅ ' : ''}${bounty.title} (#${bounty.id})

[Link to Bounty Repl](https://replit.com/@RayhanADev/Replit-Bounty-${bounty.id})

- Posted by ${bounty.user?.fullName || bounty.user.username} ([@${bounty.user.username}](https://replit.com/@${bounty.user.username}))
- Due **${moment(bounty.deadline).endOf('day').fromNow()}**
- Pays out to ${bounty.solverPayout} cycles ($${(bounty.solverPayout / 100).toFixed(2)})

### Description
\`\`\`
${mdescape(bounty.description)}
\`\`\`

---
`).join('\n'), 'utf8');

	await fs.writeFile('./TODO.md', bounties
		.filter((bounty) => bounty.status !== 'closed')
		.sort((a, b) => (new Date(a.deadline)) - (new Date(b.deadline)))
		.map((bounty) =>
`## ${bounty.status === 'closed' ? '✅ ' : ''}${bounty.title} (#${bounty.id})

[Link to Bounty Repl](https://replit.com/@RayhanADev/Replit-Bounty-${bounty.id})

- Posted by ${bounty.user?.fullName || bounty.user.username} ([@${bounty.user.username}](https://replit.com/@${bounty.user.username}))
- Due **${moment(bounty.deadline).endOf('day').fromNow()}**
- Pays out to ${bounty.solverPayout} cycles ($${(bounty.solverPayout / 100).toFixed(2)})

### Description
\`\`\`
${mdescape(bounty.description)}
\`\`\`

---
`).join('\n'), 'utf8');
};

main();