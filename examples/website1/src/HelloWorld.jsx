import React, { lazy, Suspense } from 'react';

const Title = lazy(() => import('website2/Title').then(mod => mod.default));

export default () => (
	<Suspense fallback={'fallback'}>
		<Title />
		<p>
			This app loads the heading above from website2, and doesnt expose anything
			itself.
		</p>
	</Suspense>
);
