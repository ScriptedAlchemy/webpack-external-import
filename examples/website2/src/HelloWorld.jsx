import React, { lazy, Suspense } from 'react';

const Title = lazy(() => import('./Title'));

export default () =>
	<Suspense fallback={'fallback'}>
		<Title/>
		<p>This app loads title directly, and also exposes it.</p>
	</Suspense>
