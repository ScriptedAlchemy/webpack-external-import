import React, { lazy, Suspense } from 'react';

const HelloWorld = lazy(() => import('./HelloWorld'));

export default () =>
	<Suspense fallback={'fallback'}>
		<HelloWorld/>
	</Suspense>
